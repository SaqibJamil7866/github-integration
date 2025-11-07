# github-integration Frontend

Frontend application built with Angular v19 and Angular Material

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will run on `http://localhost:4200`

## Build

To build the project for production:
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Tech Stack

- Angular v19
- Angular Material (Azure Blue theme)
- TypeScript
- SCSS for styling
- Angular Router

## Project Structure

```
frontend/
├── src/
│   ├── app/               # Application components and modules
│   │   ├── app.component.* # Root component
│   │   ├── app.config.ts   # Application configuration
│   │   └── app.routes.ts   # Route definitions
│   ├── index.html         # Main HTML file
│   ├── main.ts           # Application entry point
│   └── styles.scss       # Global styles
├── angular.json          # Angular CLI configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Development

- Port: 4200 (configured in angular.json)
- Backend API: http://localhost:3000
- Hot reload enabled for development

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run watch` - Build in watch mode
