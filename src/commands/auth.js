import { Command } from 'commander';
import inquirer from 'inquirer';
import axios from 'axios';
import fs from 'fs-extra';
import { join } from 'path';
import dotenv from 'dotenv';

export function authCommand() {
  const auth = new Command('auth');

  auth
    .description('Authenticate with the mgrep backend and manage API keys.')
    .action(async (options, command) => {
      const parentOptions = command.parent.opts();
      const backendUrl = parentOptions.backendUrl;

      console.log('Authenticating with mgrep backend...');
      const { email } = await inquirer.prompt([
        {
          type: 'input',
          name: 'email',
          message: 'Enter your email:',
          validate: (input) => /\S+@\S+\.\S+/.test(input) || 'Please enter a valid email address',
        },
      ]);

      try {
        // Step 1: Initiate authentication
        console.log('Initiating authentication...');
        await axios.post(`${backendUrl}/auth/initiate`, { email });
        console.log('Verification code initiated. (Check your email in a real scenario)');

        // Step 2: Verify code
        const { code } = await inquirer.prompt([
          {
            type: 'input',
            name: 'code',
            message: 'Enter the verification code:',
            validate: (input) => input.length > 0 || 'Verification code cannot be empty',
          },
        ]);

        console.log('Verifying code...');
        const verifyResponse = await axios.post(`${backendUrl}/auth/verify`, { email, code });
        const { api_key: apiKey, is_new_user: isNewUser } = verifyResponse.data;

        // Save API key to .env file
        const envPath = join(process.cwd(), '.env'); // Save in current working directory
        let envConfig = {};
        if (fs.existsSync(envPath)) {
          envConfig = dotenv.parse(fs.readFileSync(envPath));
        }
        envConfig.MGREP_API_KEY = apiKey;
        envConfig.BACKEND_URL = backendUrl; // Also save backend URL for consistency
        
        const newEnvContent = Object.entries(envConfig)
          .map(([key, value]) => `${key}=${value}`)
          .join('\n');
        await fs.writeFile(envPath, newEnvContent);

        console.log(`\n${isNewUser ? 'Account created and' : ''} Authenticated successfully!`);
        console.log(`Your API Key has been saved to ${envPath}`);
        console.log(`API Key: ${apiKey}`);

      } catch (error) {
        if (error.response) {
          console.error(`Error: ${error.response.status} - ${error.response.data.detail || error.response.statusText}`);
        } else {
          console.error(`Error: ${error.message}`);
        }
        process.exit(1);
      }
    });

  return auth;
}