import inquirer from 'inquirer';
async function test() {
  const counts = await inquirer.prompt([
    { type: 'number', name: 'w', message: 'Number of Werewolves?', default: 1 },
    { type: 'number', name: 'd', message: 'Number of Doctors?', default: 1 },
    { type: 'number', name: 'v', message: 'Number of Villagers?', default: 2 }
  ]);
  console.log(typeof counts.w, counts.w);
}
test();
