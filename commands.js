import 'dotenv/config';
import { getRPSChoices } from './game.js';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Get the game choices from game.js
function createCommandChoices() {
  const choices = getRPSChoices();
  const commandChoices = [];

  for (let choice of choices) {
    commandChoices.push({
      name: capitalize(choice),
      value: choice.toLowerCase(),
    });
  }

  return commandChoices;
}

// Simple test command
const HANUMAN_COMMAND = {
  name: 'hanuman',
  description: 'Prints Hanuman 10 times',
  type: 1,
};
const HANUMAN_CHALISA_COMMAND = {
  name: 'hanuman_chalisa',
  description: 'Prints Hanuman Chalisa!',
  type: 1,
};
// Command containing options
const HANUMAN_PICTURE_COMMAND ={
  name:'hanuman_picture',
  description:'Shows a stylish picture of Hanuman',
  type:1
}
const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of rock paper scissors',
  options: [
    {
      type: 3,
      name: 'object',
      description: 'Pick your object',
      required: true,
      choices: createCommandChoices(),
    },
  ],
  type: 1,
};

const ALL_COMMANDS = [HANUMAN_COMMAND,HANUMAN_CHALISA_COMMAND, HANUMAN_PICTURE_COMMAND,CHALLENGE_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);