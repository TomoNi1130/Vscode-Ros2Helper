export interface PackageInfo {
    path: string;
    nodes: string[];
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