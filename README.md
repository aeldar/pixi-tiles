# Pixi Tiles

An example Pixi.js application that uses tiles to render a large world document. The application is built with TypeScript and uses `bun` as the package manager.

## Prepare dev env

Example image generation script depends on `curl`, `magick` (ImageMagick) and `gs` (Ghostscript). The development runtime environment uses `bun`.

Either make sure they are installed on your system, or use the provided `nix` shell to run the script in a containerized environment.

Use `nix` to install dependencies:

```sh
nix develop
```

Or, if `direnv` is installed, just run:

```sh
direnv allow
```

## Prepare mock resources

Run the following command to prepare mock resources:

```sh
bun run prepare-mock-resources
```

## Run for development

Run the following command to start the development server:

```sh
bun run dev
```

