# Orphaned Git object recovery

Last Updated: 2026-10-09

Recorded at 2026-10-10T00:02:32Z UTC. These objects came from stale auxiliary checkouts of this repository. They had no surviving local commit/ref that retained their complete content. This recovery directory preserves their exact typed bytes; it does not declare the material production-ready.

`manifest.json` maps every original Git object ID, type, byte length and SHA-256 to its file. After fetching this recovery branch, recreate each original object with `git hash-object -w -t TYPE FILE`, substituting the manifest type and filename, and verify the returned object ID equals `original_sha`. Reconstructed tree objects retain the original path names, modes and child-object IDs.

Objects referenced by these trees that belonged to commit history are retained by the corresponding native history recovery refs or live remote refs. Never merge this archival directory into the product trunk without a separate content review.
