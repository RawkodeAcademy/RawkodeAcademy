import {Forbidden,type CollectionConfig,type Payload} from 'payload'
import type {AuthConfig} from './config'
import {contributorRoles,isContributor,isStaff,sessionRole} from './access'
import {digest,readCookie,OidcService,type AuthUser,type IdentityMapping} from './oidc'
import {D1AuthStore} from './store'
import {requestOrigin} from './origin'

export function identityMapping(payload:Payload,config:AuthConfig):IdentityMapping {
  return {
    async map(identity) {
      const identityKey=await digest(JSON.stringify([identity.issuer,identity.subject]))
      const find=async()=> (await payload.find({collection:'users',where:{identityKey:{equals:identityKey}},depth:0,limit:1,overrideAccess:true})).docs[0]
      const existing=await find()
      const data={identityKey,oidcIssuer:identity.issuer,oidcSubject:identity.subject,name:identity.name??'',profileEmail:identity.email??null,role:sessionRole(existing?.role,config.staffSubjects.includes(identity.subject))}
      if(existing) {
        await payload.update({collection:'users',id:existing.id,data,overrideAccess:true,context:{identityProvisioning:true}})
        return Number(existing.id)
      }
      try {
        const created=await payload.create({collection:'users',overrideAccess:true,context:{identityProvisioning:true},data:{...data,email:`${identityKey}@oidc.invalid`,password:crypto.randomUUID()+crypto.randomUUID()}})
        return Number(created.id)
      } catch(error) {
        // Unique identityKey serializes simultaneous first sign-ins. Never merge by email.
        const raced=await find()
        if(raced)return Number(raced.id)
        throw error
      }
    },
    async user(id) {
      try {
        const u=await payload.findByID({collection:'users',id,depth:0,overrideAccess:true})
        const person=u.person&&typeof u.person==='object'?(u.person as {id:number}).id:u.person
        return {id:Number(u.id),collection:'users',role:u.role==='staff'?'staff':sessionRole(u.role,false),person:typeof person==='number'?person:null,name:u.name,oidcIssuer:u.oidcIssuer,oidcSubject:u.oidcSubject} as AuthUser
      } catch {return null}
    },
  }
}
export function oidcService(payload:Payload,config:AuthConfig,db:D1Database) {return new OidcService(config,new D1AuthStore(db),identityMapping(payload,config))}
export function usersCollection(config:AuthConfig,db:D1Database):CollectionConfig {
  return {
    slug:'users',admin:{useAsTitle:'name'},
    auth:{useSessions:true,disableLocalStrategy:config.localAuth?undefined:{enableFields:true,optionalPassword:true},strategies:[{
      name:'academy-oidc',authenticate:async({headers,payload})=>{
        const origin=requestOrigin(headers,config)
        if(!origin||(headers.has('origin')&&headers.get('origin')!==origin))return {user:null}
        return {user:(await oidcService(payload,config,db).session(headers))?.user??null}
      },
    }]},
    access:{
      read:({req})=>isStaff(req.user)?true:req.user?.collection==='users'?{id:{equals:req.user.id}}:false,
      create:({req})=>isStaff(req.user),update:({req})=>isStaff(req.user),delete:()=>false,
      admin:({req})=>isStaff(req.user)||isContributor(req.user),
    },
    fields:[
      {name:'name',type:'text'},
      {name:'role',type:'select',options:['customer','guest','sponsor','staff'],required:true,defaultValue:'customer',
        admin:{description:'Staff comes from OIDC_STAFF_SUBJECTS. Guests and sponsors can propose changes to their linked Person only; staff publish.'}},
      {name:'person',type:'relationship',relationTo:'people',hasMany:false,
        admin:{description:'The one Person profile a guest or sponsor may propose changes to.',condition:data=>(contributorRoles as readonly string[]).includes(data?.role)}},
      {name:'identityKey',type:'text',unique:true,index:true,admin:{hidden:true}},
      {name:'oidcIssuer',type:'text',admin:{readOnly:true}},
      {name:'oidcSubject',type:'text',admin:{readOnly:true}},
      {name:'profileEmail',type:'email',admin:{readOnly:true}},
    ],
    hooks:{
      beforeOperation:[({operation,req})=>{
        if(operation==='refresh' && (!config.localAuth||req.user?._strategy!=='local-jwt'||req.user?.oidcIssuer||req.user?.identityKey||!isStaff(req.user)))throw new Forbidden()
      }],
      afterLogout:[async({req})=>{
        const token=readCookie(req.headers,config.sessionCookie)
        if(token)await new D1AuthStore(db).deleteSession(await digest(token))
      }],
      beforeLogin:[({user})=>{if(!config.localAuth||user.identityKey||user.role!=='staff')throw new Error('Local staff authentication is disabled for this account')}],
      beforeChange:[async({data,originalDoc,operation,req})=>{
        if(req.context.identityProvisioning===true)return data
        const protectedFields=['role','identityKey','oidcIssuer','oidcSubject','profileEmail']
        if(operation==='create') {
          if(!config.localAuth)throw new Error('Use Academy identity to provision accounts')
          if(protectedFields.some(field=>data[field] && !(field==='role'&&data[field]==='customer')))throw new Error('Identity fields are server-owned')
          data.role='staff' // Explicit loopback-only development fallback; never an OIDC account.
        } else {
          for(const field of protectedFields) {
            if(!(field in data)||JSON.stringify(data[field])===JSON.stringify(originalDoc?.[field]))continue
            // Staff may grant or revoke contributor access; staff itself stays env-owned.
            const grantable=field==='role'&&isStaff(req.user)&&['customer',...contributorRoles].includes(data.role)&&originalDoc?.role!=='staff'
            if(!grantable)throw new Error('Identity fields are server-owned')
          }
          if(!(contributorRoles as readonly string[]).includes(data.role??originalDoc?.role))data.person=null
        }
        return data
      }],
    },
  }
}
