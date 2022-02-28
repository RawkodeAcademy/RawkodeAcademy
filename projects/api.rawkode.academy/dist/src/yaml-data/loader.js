"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTypeData = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = require("js-yaml");
const promises_1 = require("fs/promises");
const schema_1 = require("../schema");
const dataDirectory = path_1.default.resolve(__dirname, "../../../../data");
async function loadTypeData(name) {
    var data = [];
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
            data.push(yaml);
        });
    });
    return data;
}
exports.loadTypeData = loadTypeData;
