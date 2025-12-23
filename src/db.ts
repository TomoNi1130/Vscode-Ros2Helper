export interface PackageInfo {
    path: string;
    nodes: string[];
    launch_files: string[];
}

export interface WorkspaceResponse {
    pkgs: {
        [pkgName: string]: PackageInfo;
    };
}

// export class WorkspaceStore {
//     private info: WorkspaceInfo | null = null;

//     replace(info: WorkspaceInfo) {
//         this.info = info;
//     }

//     snapshot(): WorkspaceInfo | null {
//         return this.info;
//     }

//     clear() {
//         this.info = null;
//     }
// }

// export const db = new WorkspaceStore();