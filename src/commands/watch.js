import { Command } from 'commander';
import chokidar from 'chokidar';
import axios from 'axios';
import fs from 'fs-extra';
import { join, resolve, relative, extname } from 'path';
import dotenv from 'dotenv';
import pc from 'picocolors';
import FormData from 'form-data';

// File extensions that should be treated as binary files
const BINARY_EXTENSIONS = new Set([
  // Images
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.ico',
  // Documents
  '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt',
  // Archives
  '.zip', '.tar', '.gz', '.rar', '.7z'
]);

// Extensions for text-based code/documents
const TEXT_EXTENSIONS = new Set([
  '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.c', '.cpp', '.h', '.hpp',
  '.go', '.rs', '.rb', '.php', '.html', '.css', '.scss', '.sass',
  '.json', '.yaml', '.yml', '.xml', '.md', '.txt', '.sh', '.bash',
  '.sql', '.r', '.swift', '.kt', '.cs', '.vb', '.pl', '.lua'
]);

export function watchCommand() {
  const watch = new Command('watch');

  watch
    .description('Watch a directory and send file changes to the backend for indexing.')
    .argument('[path]', 'Path to the directory to watch. Defaults to current directory.', '.')
    .option('-p, --project <name>', 'Project name to associate with indexed files.', 'default-project')
    .action(async (path, options, command) => {
      const parentOptions = command.parent.opts();
      const backendUrl = parentOptions.backendUrl;

      // Load API key from .env file or global options
      let apiKey = parentOptions.apiKey;
      if (!apiKey) {
        const envPath = join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          const envConfig = dotenv.parse(fs.readFileSync(envPath));
          apiKey = envConfig.MGREP_API_KEY;
        }
      }

      if (!apiKey) {
        console.error(pc.red('Error: API key not found. Please run "mgrep-cli auth" first or provide --api-key.'));
        process.exit(1);
      }

      const projectPath = resolve(path);
      const projectName = options.project;

      const ignored = [
        '**/.git/**',
        '**/node_modules/**',
        '**/.venv/**',
        '**/venv/**',
        '**/.env',
        '**/*.log',
        '**/__pycache__/**',  // Ignore Python cache directories
        '**/*.pyc',           // Ignore compiled Python files
        // Add other common ignore patterns here
      ];

      console.log(pc.green(`Watching directory: ${pc.cyan(projectPath)}`));
      console.log(pc.green(`Project Name: ${pc.cyan(projectName)}`));
      console.log(pc.gray(`Ignoring: ${ignored.join(', ')}`));
      console.log(pc.gray(`Backend URL: ${backendUrl}`));

      const watcher = chokidar.watch(projectPath, {
        ignored: ignored,
        persistent: true,
        ignoreInitial: false, // Process files on startup
        depth: undefined, // Watch all subdirectories
        awaitWriteFinish: {
          stabilityThreshold: 50,
          pollInterval: 10
        }
      });

      const sendFileToIndex = async (filePath) => {
        try {
          const relativePath = relative(projectPath, filePath);
          const ext = extname(filePath).toLowerCase();
          
          console.log(pc.yellow(`Indexing ${pc.blue(relativePath)}...`));

          // Determine if file is binary or text
          const isBinary = BINARY_EXTENSIONS.has(ext);
          const isText = TEXT_EXTENSIONS.has(ext);

          if (isBinary) {
            // Handle binary files (images, PDFs, etc.) - use multipart/form-data
            const formData = new FormData();
            formData.append('project_name', projectName);
            formData.append('file', fs.createReadStream(filePath), {
              filename: relativePath
            });

            await axios.post(`${backendUrl}/api/index/file`, formData, {
              headers: {
                'X-API-Key': apiKey,
                ...formData.getHeaders(),
              },
            });
          } else if (isText) {
            // Handle text files (code, markdown, etc.) - use JSON
            const fileContent = await fs.readFile(filePath, 'utf8');
            
            await axios.post(`${backendUrl}/api/index`, {
              project_name: projectName,
              file_path: relativePath,
              file_content: fileContent,
            }, {
              headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
              },
            });
          } else {
            // Unknown extension - try as text
            console.log(pc.gray(`  Unknown file type, attempting as text...`));
            const fileContent = await fs.readFile(filePath, 'utf8');
            
            await axios.post(`${backendUrl}/api/index`, {
              project_name: projectName,
              file_path: relativePath,
              file_content: fileContent,
            }, {
              headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
              },
            });
          }
          
          console.log(pc.green(`Successfully indexed ${pc.blue(relativePath)}.`));
        } catch (error) {
          if (error.response) {
            console.error(pc.red(`Error indexing ${pc.blue(filePath)}: ${error.response.status} - ${error.response.data.detail || error.response.statusText}`));
          } else {
            console.error(pc.red(`Error indexing ${pc.blue(filePath)}: ${error.message}`));
          }
        }
      };

      watcher
        .on('add', sendFileToIndex)
        .on('change', sendFileToIndex)
        .on('unlink', (filePath) => {
          const relativePath = relative(projectPath, filePath);
          console.log(pc.red(`File deleted: ${pc.blue(relativePath)}. (Deletion from index not implemented yet)`));
          // TODO: Implement actual deletion from index
        })
        .on('error', (error) => console.error(pc.red(`Watcher error: ${error}`)))
        .on('ready', () => console.log(pc.green('Initial scan complete. Watching for changes...')));
    });

  return watch;
}