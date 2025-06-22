import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { newServiceGenerator } from './new-service';
import { NewServiceGeneratorSchema } from './schema';

describe('new-service generator', () => {
	let tree: Tree;
	const options: NewServiceGeneratorSchema = { name: 'test' };

	beforeEach(() => {
		tree = createTreeWithEmptyWorkspace();
	});

	it('should run successfully', async () => {
		await newServiceGenerator(tree, options);
		const config = readProjectConfiguration(tree, 'test');
		expect(config).toBeDefined();
	});
});
