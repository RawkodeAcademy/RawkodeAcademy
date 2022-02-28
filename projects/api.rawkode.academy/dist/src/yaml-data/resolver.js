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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createYamlResolver = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const schema_1 = require("../schema");
const js_yaml_1 = require("js-yaml");
const type_graphql_1 = require("type-graphql");
const promises_1 = require("fs/promises");
const dataDirectory = path_1.default.resolve(__dirname, "../../../../../data");
function createYamlResolver(objectTypeCls, name, plural) {
    let YamlResolver = class YamlResolver {
        constructor() {
            this.loadData().then((data) => (this.data = data));
        }
        async loadData() {
            const data = [];
            const schema = await (0, schema_1.getSchema)();
            const schemaType = schema.getType(name);
            const directoryPath = dataDirectory + "/" + schemaType.extensions.plural;
            console.log(`Checking for data in ${directoryPath}`);
            fs_1.default.readdir(directoryPath, function (err, files) {
                if (err) {
                    return console.log("Unable to scan directory: " + err);
                }
                files.forEach(async function (file) {
                    const filepath = path_1.default.join(directoryPath, file);
                    const yaml = (0, js_yaml_1.load)(await (0, promises_1.readFile)(filepath, "utf8"));
                    // yaml.id = file.replace(".yaml", "");
                    data.push(yaml);
                });
            });
            return data;
        }
        async getAll() {
            await this.loadData();
            return this.data;
        }
    };
    __decorate([
        (0, type_graphql_1.Query)((type) => [objectTypeCls], { name: `getAll${plural}` }),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", Promise)
    ], YamlResolver.prototype, "getAll", null);
    YamlResolver = __decorate([
        (0, type_graphql_1.Resolver)(),
        __metadata("design:paramtypes", [])
    ], YamlResolver);
    return YamlResolver;
}
exports.createYamlResolver = createYamlResolver;
