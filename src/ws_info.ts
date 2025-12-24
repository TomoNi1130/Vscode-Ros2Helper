export type NodeInfo = {
    type: "executable" | "component";
    sources: string[];
};

export interface PackageInfo {
    path: string;
    nodes: Record<string, NodeInfo>;
    launch_files: string[];
}

export interface WorkspaceInfo {
    path: string;
    pkgs: {
        [pkgName: string]: PackageInfo;
    };
}

export interface WorkspaceResponse {
    pkgs: {
        [pkgName: string]: PackageInfo;
    };
}