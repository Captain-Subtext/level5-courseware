# Contributing to Courseware Learning Platform

Thank you for your interest in contributing to the Courseware Learning Platform! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct, which expects all contributors to:
- Be respectful and inclusive
- Accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report:
- Check the issues list to see if it has already been reported
- Perform a brief search to see if the problem has already been addressed

When submitting a bug report, include:
- A clear and descriptive title
- Steps to reproduce the bug
- What you expected to happen
- What actually happened
- Screenshots if applicable
- Your environment (OS, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are welcome! When suggesting an enhancement:
- Use a clear and descriptive title
- Provide a detailed description of the proposed enhancement
- Explain why this enhancement would be useful
- Include examples of how it would be used

### Pull Requests

1. Fork the repository
2. Create a new branch from `main`
3. Make your changes
4. Run tests to ensure they pass
5. Submit a pull request

Your pull request should:
- Include a clear description of the changes
- Reference any related issues
- Update documentation as needed
- Follow the existing code style
- Include tests that verify your changes

## Development Setup

1. Clone the repository
2. Install dependencies
   ```
   cd client && npm install
   cd server && npm install
   ```
3. Create `.env` files based on the examples
4. Set up a Supabase project and run the schema
5. Run the development servers
   ```
   # Terminal 1
   cd client && npm run dev
   
   # Terminal 2
   cd server && npm run dev
   ```

## Styling Guidelines

- Follow the TypeScript style guide
- Use functional components with React hooks
- Format code with Prettier
- Use descriptive variable names
- Add comments for complex logic

## License

By contributing to Courseware Learning Platform, you agree that your contributions will be licensed under the project's MIT license.

## Need Help?

If you need help with anything or have questions, feel free to:
- Open an issue with your question
- Contact the maintainers directly

Thank you for contributing to the Courseware Learning Platform! 