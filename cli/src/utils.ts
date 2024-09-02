import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { execSync } from 'child_process';
import * as glob from 'glob';
import * as path from 'path';
import {
  JS_FILE_EXTENSION,
  MJS_FILE_EXTENSION,
  NPM,
  PACKAGE_JSON,
  TS_FILE_EXTENSION,
  YARN,
  YARN_LOCK
} from './constants';

const exists = async (filePattern: string): Promise<boolean> => {
  try {
    const pattern = path.resolve(process.cwd(), filePattern);
    const files = getFileNamesByPattern(pattern);
    return files.length > 0;
  } catch (err) {
    console.error(err);
    return false;
  }
};

const getFileNamesByPattern = (pattern: string): string[] => glob.globSync(pattern);

const installPackages = async (packages: string[]): Promise<void> => {
  console.log(`Installing packages: ${packages.join(', ')}`);
  const packageManager = await exists(YARN_LOCK) ? YARN : NPM;
  const command = packageManager === YARN ? 'yarn add -D' : 'npm install --save-dev';
  execSync(`${command} ${packages.join(' ')}`, { stdio: 'inherit' });
};

const hasDependency = async (dependencyName: string): Promise<boolean> => {
  const packageJsonPath = path.resolve(PACKAGE_JSON);
  if (await exists(packageJsonPath)) {
    const packageJson = require(packageJsonPath);
    return (
      (packageJson.dependencies && packageJson.dependencies[dependencyName]) ||
      (packageJson.devDependencies && packageJson.devDependencies[dependencyName])
    );
  }
  return false;
};

const getFileExtensionByPattern = async (dir: string, filePattern: string): Promise<string | null> => {
  const fullDirPattern = path.resolve(dir, filePattern);
  const files = await getFileNamesByPattern(fullDirPattern);

  if (files.length > 0) {
    return path.extname(files[0]);
  }

  return null;
};

const genASTParserOptionsByFileExtension = (fileExtension: string, sourceType: string = 'module'): object => {
  switch (fileExtension) {
    case JS_FILE_EXTENSION:
      return {
        sourceType: sourceType
      };
    case MJS_FILE_EXTENSION:
      return {
        sourceType: sourceType,
        plugins: ['jsx']
      };
    case TS_FILE_EXTENSION:
      return {
        sourceType: sourceType,
        plugins: ['typescript']
      };
    default:
      return {};
  }
};


const genImportDeclaration = (fileExtension: string, dependency: string): t.VariableDeclaration | t.ImportDeclaration | null => {
  switch (fileExtension) {
    case JS_FILE_EXTENSION:
      return t.variableDeclaration('const', [
        t.variableDeclarator(
          t.identifier(dependency),
          t.callExpression(t.identifier('require'), [t.stringLiteral(dependency)])
        )
      ]);
    case MJS_FILE_EXTENSION:
      return t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier(dependency))],
        t.stringLiteral(dependency)
      );
    default:
      return null;
  }
};

const checkVariableDeclarationExist = (path: NodePath<t.VariableDeclarator>, dependency: string): boolean => {
  return t.isIdentifier(path.node.id, { name: dependency }) &&
    t.isCallExpression(path.node.init) &&
    path.node.init.callee.name === 'require' &&
    path.node.init.arguments[0].value === dependency;
};

const isSupportFileExtension = (fileExtension: string): boolean => {
  return [JS_FILE_EXTENSION, MJS_FILE_EXTENSION].indexOf(fileExtension) !== -1;
};

const isViteProjectSupportFileExtension = (fileExtension: string): boolean => {
  return [JS_FILE_EXTENSION, TS_FILE_EXTENSION].indexOf(fileExtension) !== -1;
};

export {
  checkVariableDeclarationExist, exists, genASTParserOptionsByFileExtension,
  genImportDeclaration, getFileExtensionByPattern, getFileNamesByPattern, hasDependency, installPackages, isSupportFileExtension,
  isViteProjectSupportFileExtension
};
