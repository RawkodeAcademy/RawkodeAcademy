export interface NewServiceGeneratorSchema {
  name: string;
  directory: string;
  serviceType: 'bun-dagger' | 'deno-dagger';
  tags?: string;
}
