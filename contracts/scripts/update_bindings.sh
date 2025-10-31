#!/bin/bash

set -e

echo "🔄 Building contracts and generating TypeScript bindings..."

# Build contracts with TypeScript bindings
sozo build --typescript

echo "📋 Copying bindings to frontend..."

# Copy the generated bindings to the client
cp bindings/typescript/models.gen.ts ../client/src/dojo/generated/typescript/
cp bindings/typescript/contracts.gen.ts ../client/src/dojo/generated/typescript/

echo "✅ Bindings updated successfully!"
echo ""
echo "The following files have been updated:"
echo "  - client/src/dojo/generated/typescript/models.gen.ts"
echo "  - client/src/dojo/generated/typescript/contracts.gen.ts"
echo ""
echo "💡 Make sure to restart your frontend development server to pick up the changes." 