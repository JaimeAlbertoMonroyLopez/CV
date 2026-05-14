# Functional Specifications

## Data Persistence Strategy
The application uses IndexedDB as the primary client-side persistence layer (through Dexie.js) to reduce the risk of data loss during normal user workflows.

## Why IndexedDB
IndexedDB provides durable, structured storage in the browser and supports asynchronous CRUD operations, which makes it a better fit than localStorage for frequent updates and larger datasets.

## Runtime Delivery and Offline Behavior
- Runtime libraries are delivered from local project assets (`vendor/`), not CDN URLs.
- The application is intended to work in offline development scenarios where internet access is unavailable.

## Data Loss Prevention Scope
Using IndexedDB is intended to preserve user-created data when:
- the page is refreshed,
- the browser is closed and opened again, or
- the computer is restarted.

## Important Note
Persistence still depends on the same browser profile and origin. Data may be lost if site data is manually cleared, private browsing policies remove storage, or browser policies enforce cleanup.

## Current UI Control Scope
The UI includes an external vertical control rail (`cv-control-rail`) designed to host action controls outside the main CV template area. The first control currently available is the Add (`+`) action button.
