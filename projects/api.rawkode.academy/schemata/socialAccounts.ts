import { Length } from "class-validator";
import { Field, ObjectType } from "type-graphql";

@ObjectType({})
export class SocialAccounts {
  @Field({
    nullable: true,
    description: "The person's GitHub username",
  })
  @Length(1, 39)
  github?: string;

  @Field({
    nullable: true,
    description: "The person's Twitter username",
  })
  @Length(4, 15)
  twitter?: string;
}
