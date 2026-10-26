import { Command } from 'commander';
import {
  openDatabase,
  ProjectRepository,
  OperationRepository,
  reconcilePending,
} from '@spectide/storage';
import { output } from './output.js';
import { fail } from './error-handler.js';
import { runDoctor } from './commands/doctor.js';
import { add, lifecycle, runRelink } from './commands/projects.js';
import { initProject } from './commands/init.js';
import { preview, confirm } from './commands/workspace.js';
import { recoverWorkspaces } from '@spectide/workspace';
import { revalidateProject } from '@spectide/project';
export function createProgram() {
  const program = new Command();
  program.name('spectide').description('Local-first project foundation CLI').version('0.1.0');
  let context:
    | { db: ReturnType<typeof openDatabase>; projects: ProjectRepository; ops: OperationRepository }
    | undefined;
  const ctx = () =>
    (context ??= (() => {
      const db = openDatabase();
      return { db, projects: new ProjectRepository(db), ops: new OperationRepository(db) };
    })());
  program.hook('preAction', async () => {
    const c = ctx();
    reconcilePending(c.db);
    await recoverWorkspaces(c.db);
  });
  program
    .command('doctor')
    .argument('[path]')
    .option('--project <selector>')
    .option('--json')
    .action(async (path, opts) => {
      try {
        const result = await runDoctor(path, opts.project, ctx().projects, ctx().db);
        output(
          {
            repository: {
              root_realpath: result.repo.root,
              git_identity_fingerprint: result.repo.git.fingerprint,
              working_tree_state: result.repo.git.workingTreeState,
            },
            diagnostics: result.diagnostics,
            compatibility_gate: result.compatibility_gate,
          },
          opts.json,
        );
      } catch (e) {
        fail(e, opts.json);
      }
    });
  program
    .command('init')
    .argument('[path]', 'repository path')
    .option('--confirm-trust')
    .option('--display-name <name>')
    .option('--json')
    .action(async (path, opts) => {
      try {
        const c = ctx();
        output(
          await initProject(
            path || process.cwd(),
            opts.confirmTrust,
            opts.displayName,
            c.projects,
            c.ops,
          ),
          opts.json,
        );
      } catch (e) {
        fail(e, opts.json);
      }
    });
  const pc = program.command('projects');
  pc.command('recoveries')
    .option('--json')
    .action((o) => {
      try {
        output({ operations: ctx().ops.listRecoverable() }, o.json);
      } catch (e) {
        fail(e, o.json);
      }
    });
  pc.command('add')
    .argument('<path>')
    .option('--confirm-trust')
    .option('--display-name <name>')
    .option('--json')
    .action(async (p, o) => {
      try {
        const c = ctx();
        output(await add(p, o.confirmTrust, o.displayName, c.projects, c.ops), o.json);
      } catch (e) {
        fail(e, o.json);
      }
    });
  pc.command('list')
    .option('--include-archived')
    .option('--json')
    .action(async (o) => {
      try {
        const c = ctx();
        const projects = c.projects.list(o.includeArchived);
        for (const project of projects) await revalidateProject(project, c.projects);
        output({ projects }, o.json);
      } catch (e) {
        fail(e, o.json);
      }
    });
  for (const action of ['rename', 'archive', 'restore', 'unregister']) {
    pc.command(action)
      .argument('<selector>')
      .argument(action === 'rename' ? '<display-name>' : '[unused]')
      .option('--confirm')
      .option('--json')
      .action(async (selector, value, o) => {
        try {
          const c = ctx();
          output(
            await lifecycle(
              action,
              selector,
              action === 'rename' ? value : undefined,
              o.confirm,
              c.projects,
              c.ops,
            ),
            o.json,
          );
        } catch (e) {
          fail(e, o.json);
        }
      });
  }
  pc.command('relink')
    .argument('<selector>')
    .argument('<path>')
    .option('--confirm-trust')
    .option('--json')
    .action(async (selector, path, o) => {
      try {
        const c = ctx();
        output(await runRelink(selector, path, o.confirmTrust, c.projects, c.ops), o.json);
      } catch (e) {
        fail(e, o.json);
      }
    });
  program
    .command('workspace')
    .command('prepare')
    .requiredOption('--project <selector>')
    .requiredOption('--base <revision>')
    .option('--preview')
    .option('--confirm <digest>')
    .option('--json')
    .action(async (o) => {
      try {
        const c = ctx();
        output(
          o.preview
            ? await preview(c.db, c.projects, o.project, o.base)
            : await confirm(c.db, c.projects, o.project, o.base, o.confirm),
          o.json,
        );
      } catch (e) {
        fail(e, o.json);
      }
    });
  return program;
}
