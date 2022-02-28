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
exports.SocialAccounts = void 0;
const class_validator_1 = require("class-validator");
const type_graphql_1 = require("type-graphql");
let SocialAccounts = class SocialAccounts {
};
__decorate([
    (0, type_graphql_1.Field)({
        nullable: true,
        description: "The person's GitHub username",
    }),
    (0, class_validator_1.Length)(1, 39),
    __metadata("design:type", String)
], SocialAccounts.prototype, "github", void 0);
__decorate([
    (0, type_graphql_1.Field)({
        nullable: true,
        description: "The person's Twitter username",
    }),
    (0, class_validator_1.Length)(4, 15),
    __metadata("design:type", String)
], SocialAccounts.prototype, "twitter", void 0);
SocialAccounts = __decorate([
    (0, type_graphql_1.ObjectType)({})
], SocialAccounts);
exports.SocialAccounts = SocialAccounts;
