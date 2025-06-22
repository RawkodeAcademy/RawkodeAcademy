import {
  formatFiles,
  generateFiles,
  names,
  Tree,
  offsetFromRoot,
  // readNxJson, // Can be used to get npmScope or other workspace config
} from '@nx/devkit';
import * as path from 'path';
import { NewServiceGeneratorSchema } from './schema';

interface NormalizedSchema extends NewServiceGeneratorSchema {
  originalName: string;       // User-provided name
  serviceFileName: string;    // kebab-case for file/directory names (e.g., my-new-service)
  serviceClassName: string;   // PascalCase for class names (e.g., MyNewService)
  projectName: string;        // kebab-case name for NX project graph (e.g., rawkode-academy-platform-my-new-service)
  projectRoot: string;        // Full path to the project root (e.g., projects/rawkode.academy/platform/my-new-service)
  projectDirectory: string;   // The input 'directory' option (e.g., rawkode.academy/platform)
  parsedTags: string[];
  npmScope: string;           // Default NPM scope for the workspace
}

function normalizeOptions(tree: Tree, options: NewServiceGeneratorSchema): NormalizedSchema {
  const originalName = options.name;
  const nameVariations = names(options.name);
  const serviceFileName = nameVariations.fileName;  // kebab-case
  const serviceClassName = nameVariations.className; // PascalCase

  const projectRoot = `projects/${options.directory}/${serviceFileName}`;

  // Ensure project name is valid (e.g. no leading slashes if directory is empty)
  const dirPrefix = options.directory ? `${options.directory.replace(/\//g, '-')}-` : '';
  const projectName = `${dirPrefix}${serviceFileName}`;

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  // const nxJson = readNxJson(tree);
  // const npmScope = nxJson?.npmScope || '@rawkode'; // Default if not set in nx.json
  const npmScope = '@rawkode'; // Defaulting for now

  return {
    ...options, // Original options (name, directory, serviceType, tags)
    originalName,
    serviceFileName,
    serviceClassName,
    projectName,
    projectRoot,
    projectDirectory: options.directory,
    parsedTags,
    npmScope,
  };
}

export default async function (tree: Tree, options: NewServiceGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);

  const templateTypePath = options.serviceType; // "bun-dagger" or "deno-dagger"
  const sourceTemplatesPath = path.join(__dirname, './files', templateTypePath);

  // Data for template substitutions
  const templateSubstitutions = {
    ...normalizedOptions, // Includes all normalized fields
    name: normalizedOptions.serviceFileName, // kebab-case 'name' for file names and simple references
    className: normalizedOptions.serviceClassName, // PascalCase for classes
    propertyName: names(normalizedOptions.originalName).propertyName, // camelCase of original name
    constantName: names(normalizedOptions.originalName).constantName, // UPPER_CASE of original name
    offsetFromRoot: offsetFromRoot(normalizedOptions.projectRoot),
    template: '', // Required by generateFiles, can be empty.
  };

  generateFiles(
    tree,
    sourceTemplatesPath,
    normalizedOptions.projectRoot,
    templateSubstitutions
  );

  // No need for addProjectConfiguration if project.json is part of the generated files.
  // NX will pick it up.

  await formatFiles(tree);
}
