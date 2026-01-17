import { Command } from 'commander';
import axios from 'axios';
import fs from 'fs-extra';
import { join } from 'path';
import dotenv from 'dotenv';
import pc from 'picocolors';
import boxen from 'boxen';
import { highlight } from 'cli-highlight';

export function searchCommand() {
  const search = new Command('search');

  search
    .description('Search the indexed code in the backend.')
    .argument('<query>', 'The search query string.')
    .option('-p, --project <name>', 'Project name to search within.', null)
    .option('-k, --top-k <number>', 'Number of top results to return.', '5')
    .action(async (query, options, command) => {
      const parentOptions = command.parent.opts();
      const backendUrl = parentOptions.backendUrl;

      let apiKey = parentOptions.apiKey;
      if (!apiKey) {
        const envPath = join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          const envConfig = dotenv.parse(fs.readFileSync(envPath));
          apiKey = envConfig.MGREP_API_KEY;
        }
      }

      if (!apiKey) {
        console.error(pc.red('Error: API key not found. Please run "codesearch-cli auth" first or provide --api-key.'));
        process.exit(1);
      }

      const topK = parseInt(options.topK, 10);
      if (isNaN(topK) || topK <= 0) {
        console.error(pc.red('Error: --top-k must be a positive number.'));
        process.exit(1);
      }

      try {
        console.log(pc.green(`Searching for "${query}" in project "${options.project || 'all projects'}"...`));
        
        const searchPayload = {
          query: query,
          top_k: topK,
        };
        if (options.project) {
          searchPayload.project_name = options.project;
        }

        const response = await axios.post(`${backendUrl}/api/search`, searchPayload, {
          headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
        });

        if (response.data && response.data.hits && response.data.hits.hits.length > 0) {
          console.log(pc.green(`
Found ${response.data.hits.hits.length} results:`));
          response.data.hits.hits.forEach(hit => {
            const source = hit._source;
            const score = hit._score;

            const title = `${pc.cyan(source.project_name)} / ${pc.blue(source.file_path)}`;
            const scoreText = `Score: ${pc.magenta(score ? score.toFixed(4) : 'N/A')}`;
            const linesText = `Lines: ${pc.yellow(`${source.line_start}-${source.line_end}`)}`;
            
            const header = `${title} | ${scoreText} | ${linesText}`;

            const highlightedCode = highlight(source.code_content, { 
              language: source.language || 'plaintext',
              ignoreIllegals: true 
            });

            const box = boxen(
              `${pc.bold(header)}

${highlightedCode}`,
              {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'blue',
                title: `Result`,
                titleAlignment: 'center'
              }
            );
            console.log(box);
          });
        } else {
          console.log(pc.yellow('No results found.'));
        }

      } catch (error) {
        if (error.response) {
          console.error(pc.red(`Error: ${error.response.status} - ${error.response.data.detail || error.response.statusText}`));
        } else {
          console.error(pc.red(`Error: ${error.message}`));
        }
        process.exit(1);
      }
    });

  return search;
}
