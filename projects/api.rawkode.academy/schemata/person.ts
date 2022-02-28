import { ID, Field, ObjectType, Extensions } from "type-graphql";
import { SocialAccounts } from "./socialAccounts";

@ObjectType({
  description:
    "A person object, used to represent guests on the Rawkode Academy YouTube channel",
})
@Extensions({ plural: "people" })
export class Person {
  @Field((type) => ID)
  id: string;

  @Field({ description: "The person's full name" })
  name: string;

  @Field({
    description:
      "The person's preferred short name, used for grettings and such",
  })
  shortName: string;

  @Field({
    nullable: true,
    description:
      "The person's email address, if they're happy for one to be public",
  })
  emailAddress?: string;

  @Field({ nullable: true, description: "The person's social accounts" })
  socialAccounts?: SocialAccounts;
}
