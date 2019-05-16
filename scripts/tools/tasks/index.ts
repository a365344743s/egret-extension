
export type FileOptions = {
    outputDir?: string,
    type?: string,
    subkeys?: string[] | string
};


export type PluginContext = {
    projectRoot: string,
    resourceFolder: string,
    buildConfig: { command: "build" | "publish" },
    outputDir: string,
    createFile: (relativePath: string, content: Buffer, options?: FileOptions) => void
}