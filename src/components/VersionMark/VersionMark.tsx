import styles from "./VersionMark.module.css";

/** Plain "v3"; the latest version is set in pen blue (brief section 7, P2 node "v6"). */
export function VersionMark({ version, latest = false }: { version: number; latest?: boolean }) {
  return (
    <span
      className={`${styles.version} ${latest ? styles.latest : ""}`}
      aria-label={latest ? `Version ${version}, latest` : `Version ${version}`}
    >
      v{version}
    </span>
  );
}
