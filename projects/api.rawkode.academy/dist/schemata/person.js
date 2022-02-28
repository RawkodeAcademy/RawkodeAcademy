"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Person = void 0;
const type_graphql_1 = require("type-graphql");
const socialAccounts_1 = require("./socialAccounts");
let Person = class Person {
};
__decorate([
    (0, type_graphql_1.Field)((type) => type_graphql_1.ID),
    __metadata("design:type", String)
], Person.prototype, "id", void 0);
__decorate([
    (0, type_graphql_1.Field)({ description: "The person's full name" }),
    __metadata("design:type", String)
], Person.prototype, "name", void 0);
__decorate([
    (0, type_graphql_1.Field)({
        description: "The person's preferred short name, used for grettings and such",
    }),
    __metadata("design:type", String)
], Person.prototype, "shortName", void 0);
__decorate([
    (0, type_graphql_1.Field)({
        nullable: true,
        description: "The person's email address, if they're happy for one to be public",
    }),
    __metadata("design:type", String)
], Person.prototype, "emailAddress", void 0);
__decorate([
    (0, type_graphql_1.Field)({ nullable: true, description: "The person's social accounts" }),
    __metadata("design:type", socialAccounts_1.SocialAccounts)
], Person.prototype, "socialAccounts", void 0);
Person = __decorate([
    (0, type_graphql_1.ObjectType)({
        description: "A person object, used to represent guests on the Rawkode Academy YouTube channel",
    }),
    (0, type_graphql_1.Extensions)({ plural: "people" })
], Person);
exports.Person = Person;
