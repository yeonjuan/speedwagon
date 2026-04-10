declare module "optionator" {
  interface OptionDefinition {
    option: string;
    alias?: string;
    type: string;
    description?: string;
    default?: string;
    required?: boolean;
    overrideRequired?: boolean;
    dependsOn?: string[];
    concatRepeatedArrays?: boolean;
    mergeRepeatedObjects?: boolean;
    longDescription?: string;
    example?: string | string[];
  }

  interface LibOptions {
    prepend?: string;
    append?: string;
    options: OptionDefinition[];
    helpStyle?: object;
    mutuallyExclusive?: string[][];
    concatRepeatedArrays?: boolean;
    mergeRepeatedObjects?: boolean;
    positionalAnywhere?: boolean;
    typeAliases?: Record<string, string>;
    defaults?: object;
    stdout?: NodeJS.WritableStream;
  }

  type ParsedOptions = {
    _: string[];
  } & Record<string, unknown>;

  interface Optionator {
    parse(
      input: string | string[],
      options?: { slice?: number },
    ): ParsedOptions;
    parseArgv(input: string[]): ParsedOptions;
    generateHelp(options?: { showHidden?: boolean }): string;
    generateHelpForOption(optionName: string): string;
  }

  function optionator(options: LibOptions): Optionator;
  export = optionator;
}
