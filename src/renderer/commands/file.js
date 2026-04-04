const LANGUAGE_MAP = {
  // TypeScript
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  // JavaScript
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  // JSON
  json: 'json',
  jsonc: 'json',
  json5: 'json',
  // CSS family
  css: 'css',
  scss: 'scss',
  less: 'less',
  // HTML / templating
  html: 'html',
  htm: 'html',
  cshtml: 'razor',
  hbs: 'handlebars',
  pug: 'pug',
  jade: 'pug',
  twig: 'twig',
  liquid: 'liquid',
  // Markdown
  md: 'markdown',
  mdx: 'mdx',
  rst: 'restructuredtext',
  // Python
  py: 'python',
  // Ruby
  rb: 'ruby',
  // Go
  go: 'go',
  // Rust
  rs: 'rust',
  // Java / JVM
  java: 'java',
  kt: 'kotlin',
  kts: 'kotlin',
  scala: 'scala',
  // C family (Monaco bundles C under cpp)
  c: 'cpp',
  h: 'cpp',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  // C#
  cs: 'csharp',
  // Objective-C
  m: 'objective-c',
  // Shell / scripting
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  ps1: 'powershell',
  psm1: 'powershell',
  psd1: 'powershell',
  bat: 'bat',
  cmd: 'bat',
  // YAML / config
  yaml: 'yaml',
  yml: 'yaml',
  ini: 'ini',
  cfg: 'ini',
  conf: 'ini',
  // TOML has no Monaco language; ini is the closest
  toml: 'ini',
  // SQL family
  sql: 'sql',
  // XML / data
  xml: 'xml',
  xsl: 'xml',
  xsd: 'xml',
  svg: 'xml',
  // Swift
  swift: 'swift',
  // Dart
  dart: 'dart',
  // PHP
  php: 'php',
  // Lua
  lua: 'lua',
  // R
  r: 'r',
  // Julia
  jl: 'julia',
  // Perl
  pl: 'perl',
  pm: 'perl',
  // Elixir
  ex: 'elixir',
  exs: 'elixir',
  // F#
  fs: 'fsharp',
  fsx: 'fsharp',
  fsi: 'fsharp',
  // Clojure
  clj: 'clojure',
  cljs: 'clojure',
  cljc: 'clojure',
  // CoffeeScript
  coffee: 'coffee',
  // GraphQL
  graphql: 'graphql',
  gql: 'graphql',
  // HCL / Terraform
  hcl: 'hcl',
  tf: 'hcl',
  tfvars: 'hcl',
  // Protobuf
  proto: 'protobuf',
  // Solidity
  sol: 'solidity',
  // Scheme
  scm: 'scheme',
  ss: 'scheme',
  // TCL
  tcl: 'tcl',
  // Pascal
  pas: 'pascal',
  // Visual Basic
  vb: 'vb',
  vbs: 'vb',
  // Bicep
  bicep: 'bicep',
  // WGSL
  wgsl: 'wgsl',
  // Cypher (Neo4j)
  cypher: 'cypher',
  // SPARQL
  sparql: 'sparql',
  // Q#
  qs: 'qsharp',
  // TypeSpec
  tsp: 'typespec',
  // PowerQuery
  pq: 'powerquery',
  pqm: 'powerquery',
  // ECL
  ecl: 'ecl',
  // ABAP
  abap: 'abap',
  // Redis
  redis: 'redis',
};

function inferLanguage(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  return LANGUAGE_MAP[ext] ?? 'plaintext';
}

export default async function execute(stmt, page, context) {
  const language = inferLanguage(stmt.name);
  await page.evaluate(
    ({ name, language: lang }) => globalThis.__popcorn.openFile(name, lang),
    { name: stmt.name, language }
  );

  for (const cmd of stmt.commands) {
    const handler = context.registry[cmd.type];
    if (!handler) {
      console.warn(`[executor] Unknown file-level command: ${cmd.type}`);
      continue;
    }
    await handler(cmd, page, context);
  }
}
