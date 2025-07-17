# Effect Layer Implementation Guide for AI Agents

This guide provides essential patterns for implementing the **Effect Layer** that handles side effects and external system interactions in our clean architecture.

## Core Philosophy

> "副作用を分離し、ドメインロジックを純粋に保つ"

The Effect Layer serves as the boundary between pure domain logic and the external world:
- **Side Effect Isolation**: Keep domain logic pure by isolating side effects
- **External System Integration**: Handle file system, network, database operations
- **Error Handling**: Provide robust error handling for external operations
- **Async Operations**: Manage asynchronous operations with Result types
- **Resource Management**: Handle resource cleanup and lifecycle
