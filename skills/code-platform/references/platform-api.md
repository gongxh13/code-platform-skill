## Platform API Script References

We provide a Node.js script library for reliable code repository platform API operations. The library supports multiple platforms with automatic platform detection and authentication handling.

### Available Commands

The following commands are available. Use `--help` with any command to see detailed usage and options.

*   `platform-api create-issue`: Create a new Issue (does not automatically assign)
*   `platform-api get-issue`: Get Issue details
*   `platform-api claim-issue`: Claim an Issue by assigning it to fork.owner from config
*   `platform-api update-issue`: Update an existing Issue (does not automatically assign)
*   `platform-api list-issues`: List all Issues
*   `platform-api create-pr`: Create a Pull Request
*   `platform-api update-pr`: Update a Pull Request
*   `platform-api list-prs`: List all Pull Requests

### Command Examples

Here are usage examples for each command. All examples use the correct parameters matching the code implementation.

#### Issue Commands

```bash
# Create a new issue
platform-api create-issue --title "New Issue" --description "Issue description"

# Get issue details
platform-api get-issue --id 123

# Claim an issue
platform-api claim-issue --id 123

# Update an issue
platform-api update-issue --id 123 --title "Updated Title"

# List all issues
platform-api list-issues --state open
```

#### Pull Request Commands

```bash
# Create a pull request
platform-api create-pr --title "Feature PR" --description "PR description" --source-branch "feature-branch" --target-branch "main"

# Update a pull request
platform-api update-pr --id 123 --title "Updated Title"

# List pull requests
platform-api list-prs --state open
```

#### Other Commands

```bash
# Report phase status
platform-api phase-report --phase development --issue 123 --status complete
```

### Getting Help

To see the full list of options and arguments, use the `--help` flag:

```bash
# Global help - shows all available commands
platform-api --help

# Command-specific help - shows detailed options for each command
platform-api create-issue --help
platform-api get-issue --help
platform-api claim-issue --help
platform-api update-issue --help
platform-api list-issues --help
platform-api create-pr --help
platform-api update-pr --help
platform-api list-prs --help
```