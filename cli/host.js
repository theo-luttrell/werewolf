import inquirer from 'inquirer';
import chalk from 'chalk';
import { GameManager } from './gameManager.js';

const gm = new GameManager();

gm.onActionSubmitted = (role) => {
  if (gm.state === 'voting') {
    console.log(chalk.dim(`\n[Update] A vote has been cast.`));
  } else if (role === 'werewolf') {
    console.log(chalk.dim(`\n[Update] A Werewolf has locked in their target.`));
  } else if (role === 'doctor') {
    console.log(chalk.dim(`\n[Update] The Doctor has locked in their save.`));
  } else if (role === 'seer') {
    console.log(chalk.dim(`\n[Update] A Seer has locked in their target.`));
  } else if (role === 'thief') {
    console.log(chalk.dim(`\n[Update] The Thief has locked in their target.`));
  }
};

async function main() {
  console.log(chalk.bold.yellow("Werewolf Host Environment Initialized."));

  while (true) {
    const { command } = await inquirer.prompt([{
      type: 'input',
      name: 'command',
      message: 'host>'
    }]);

    const cmd = command.trim().toLowerCase();

    try {
      if (cmd === 'werewolf env start') {
        console.log(chalk.green("Environment active. Use 'game open' to begin."));
      }
      else if (cmd === 'game open') {
        const code = await gm.openGame((players) => {
          console.log(chalk.dim(`\n[Update] Player count is now: ${Object.keys(players).length}`));
        });
        console.log(chalk.bgBlue.white(` ROOM OPEN `) + ` Code: ` + chalk.bold.green(code));
      }
      else if (cmd === 'game roles') {
        if (!gm.roomCode) {
          console.log(chalk.red("Open a game first."));
          continue;
        }

        const counts = await inquirer.prompt([
          { type: 'number', name: 'w', message: 'Number of Werewolves?', default: 1 },
          { type: 'number', name: 'm', message: 'Number of Minions?', default: 0 },
          { type: 'number', name: 'd', message: 'Number of Doctors?', default: 1 },
          { type: 'number', name: 's', message: 'Number of Seers?', default: 0 },
          { type: 'number', name: 't', message: 'Number of Thieves?', default: 0 },
          { type: 'number', name: 'v', message: 'Number of Villagers?', default: 2 }
        ]);

        await gm.assignRoles(counts.w, counts.m, counts.d, counts.s, counts.t, counts.v);
        console.log(chalk.green("Roles assigned. Players are now viewing their roles."));
      }
      else if (cmd === 'game start' || cmd === 'night start') {
        if (await gm.checkWinCondition()) {
          console.log(chalk.bold.magenta("Game Over! Win condition met."));
          continue;
        }
        await gm.startNight();
        console.log(chalk.blue(`Night ${gm.dayNumber} has started. Waiting for player actions...`));
      }
      else if (cmd === 'night end') {
        await gm.endNight();
        console.log(chalk.yellow(`Night ended. Day ${gm.dayNumber} has begun. Morning report sent.`));

        // Optionally prompt to start discussion directly or let them wait
        const { startDisc } = await inquirer.prompt([{
          type: 'confirm',
          name: 'startDisc',
          message: 'Start 60s discussion timer now?',
          default: true
        }]);

        if (startDisc) {
          await gm.startDiscussion(60);
          console.log(chalk.green("Discussion started."));
        }
      }
      else if (cmd === 'disc end') {
        await gm.startVoting();
        console.log(chalk.cyan("Discussion ended. Voting has started."));
      }
      else if (cmd === 'vote end') {
        await gm.endVoting();
        console.log(chalk.magenta("Voting ended. Summary displayed."));

        if (await gm.checkWinCondition()) {
          console.log(chalk.bold.magenta("Game Over! Win condition met."));
        }
      }
      else if (cmd === 'reveal crit') {
        console.log(chalk.bgRed.white(" CRITICAL INFO REVEALED "));
        console.log(chalk.yellow("Players:"));
        Object.entries(gm.players).forEach(([id, p]) => {
          console.log(` - ${p.name} (${p.role}) - ${p.isAlive ? 'Alive' : 'Dead'}`);
        });
        console.log(chalk.yellow("Actions:"));
        Object.entries(gm.actions).forEach(([id, a]) => {
          const actor = gm.players[id] ? gm.players[id].name : id;
          const target = gm.players[a.target] ? gm.players[a.target].name : a.target;
          console.log(` - ${actor} targeted ${target}`);
        });
      }
      else if (cmd === 'kick players') {
        await gm.kickPlayers();
        console.log(chalk.yellow("All players have been kicked to the login screen."));
      }
      else if (cmd.startsWith('state alive ')) {
        const name = cmd.replace('state alive ', '').trim();
        await gm.setPlayerState(name, true);
        console.log(chalk.green(`${name} is now alive.`));
      }
      else if (cmd.startsWith('state dead ')) {
        const name = cmd.replace('state dead ', '').trim();
        await gm.setPlayerState(name, false);
        console.log(chalk.red(`${name} is now dead.`));
      }
      else if (cmd === 'exit' || cmd === 'quit') {
        console.log("Exiting host environment.");
        process.exit(0);
      }
      else {
        if (cmd) console.log(chalk.red("Unknown command."));
      }
    } catch (e) {
      console.log(chalk.bgRed.white(" ERROR "), e.message);
    }
  }
}

main();
