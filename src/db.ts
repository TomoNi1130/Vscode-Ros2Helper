export interface LaunchInfo {
    fileName: string;
    path: string; // absolute
}

export interface NodeInfo {
    execName: string;
    execPath: string;
}

export interface PackageInfo {
    name: string;
    nodes: readonly NodeInfo[];
    path: string;
}

export interface WorkspaceInfo {
    launches: readonly LaunchInfo[];
    packages: readonly PackageInfo[];
}

export class WorkspaceStore {
    private info: WorkspaceInfo | null = null;

    replace(info: WorkspaceInfo) {
        this.info = info;
    }

    snapshot(): WorkspaceInfo | null {
        return this.info;
    }

    clear() {
        this.info = null;
    }
}

// export const db = new WorkspaceStore();