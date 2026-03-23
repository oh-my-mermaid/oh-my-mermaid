#!/usr/bin/env node

import { commandInit } from './commands/init.js';
import { commandClassField } from './commands/class-field.js';
import { commandList } from './commands/list.js';
import { commandShow } from './commands/show.js';
import { commandDelete } from './commands/delete.js';
import { commandStatus } from './commands/status.js';
import { commandDiff } from './commands/diff.js';
import { commandRefs } from './commands/refs.js';
import { commandView } from './commands/view.js';
import { commandLogin } from './commands/login.js';
import { commandLogout } from './commands/logout.js';
import { commandPush } from './commands/push.js';
import { commandPull } from './commands/pull.js';
import { commandLink } from './commands/link.js';
import { commandShare } from './commands/share.js';
import { commandSetup } from './commands/setup.js';
import { commandOrg } from './commands/org.js';

const GLOBAL_COMMANDS = ['init', 'setup', 'list', 'show', 'delete', 'status', 'diff', 'refs', 'view', 'login', 'logout', 'push', 'pull', 'link', 'share', 'org', 'help'];

function printHelp(): void {
  const help = `
oh-my-mermaid (omm) — Architecture mirror for vibe coding

Usage:
  omm init                          Initialize .omm/ directory (usually not needed)
  omm setup [platform]              Register skills with AI coding tools
  omm setup --list                  Show detected platforms
  omm setup --teardown              Unregister from all platforms
  omm list                          List all classes
  omm show <class>                  Show all fields for a class
  omm delete <class>                Delete a class
  omm status                        Show overview of all classes
  omm diff <class>                  Compare current vs previous diagram
  omm refs <class>                  Show classes that reference this class
  omm refs --reverse <class>        Show classes this class references
  omm view [--port <port>]         Start web viewer (default: 3000)

  omm <class> <field>               Read a field (stdout)
  omm <class> <field> <content>     Write a field
  omm <class> <field> -             Write a field from stdin

Cloud:
  omm login                         Log in to omm.dev
  omm logout                        Log out
  omm link [org/slug]                Link project to a cloud slug
  omm push                          Push .omm/ to cloud
  omm pull                          Pull .omm/ from cloud
  omm share                         Print the shareable URL
  omm org list                      List your organizations
  omm org switch <slug>             Set default organization
  omm org members [slug]            View members (opens web)

Fields: description, diagram, constraint, concern, context, todo, note
`;
  process.stdout.write(help.trim() + '\n');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    return;
  }

  const cmd = args[0];

  switch (cmd) {
    case 'init':
      commandInit();
      return;

    case 'setup':
      await commandSetup(args.slice(1));
      return;

    case 'list':
      commandList();
      return;

    case 'show':
      if (!args[1]) {
        process.stderr.write('error: omm show <class>\n');
        process.exit(1);
      }
      commandShow(args[1]);
      return;

    case 'delete':
      if (!args[1]) {
        process.stderr.write('error: omm delete <class>\n');
        process.exit(1);
      }
      commandDelete(args[1]);
      return;

    case 'status':
      commandStatus();
      return;

    case 'diff':
      if (!args[1]) {
        process.stderr.write('error: omm diff <class>\n');
        process.exit(1);
      }
      commandDiff(args[1]);
      return;

    case 'refs': {
      let reverse = false;
      let className = args[1];
      if (args[1] === '--reverse') {
        reverse = true;
        className = args[2];
      }
      if (!className) {
        process.stderr.write('error: omm refs [--reverse] <class>\n');
        process.exit(1);
      }
      commandRefs(className, reverse);
      return;
    }

    case 'view': {
      let port = 3000;
      if (args[1] === '--port' && args[2]) {
        port = parseInt(args[2], 10);
        if (isNaN(port)) {
          process.stderr.write('error: invalid port number\n');
          process.exit(1);
        }
      }
      commandView(port);
      return;
    }

    case 'login':
      await commandLogin();
      return;

    case 'logout':
      commandLogout();
      return;

    case 'link':
      commandLink(args[1]);
      return;

    case 'push':
      await commandPush();
      return;

    case 'pull':
      await commandPull();
      return;

    case 'share':
      commandShare();
      return;

    case 'org':
      await commandOrg(args[1], args[2]);
      return;

    default:
      // Class-field pattern: omm <class> <field> [content]
      if (args.length >= 2 && !GLOBAL_COMMANDS.includes(cmd)) {
        const className = cmd;
        const field = args[1];
        const content = args.length >= 3 ? args.slice(2).join(' ') : undefined;
        await commandClassField(className, field, content);
        return;
      }

      process.stderr.write(`error: unknown command '${cmd}'. Run 'omm help' for usage.\n`);
      process.exit(1);
  }
}

main().catch(err => {
  process.stderr.write(`error: ${err.message}\n`);
  process.exit(1);
});
