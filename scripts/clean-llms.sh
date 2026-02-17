#!/bin/bash
# Strips Docusaurus admonition syntax (:::info, :::warning, :::tip, :::note, etc.)
# from generated llms*.txt files, preserving the content inside admonitions.
#
# Handles all formats:
#   :::info[Label]     → > **Note: Label**
#   :::warning[Label]  → > **Warning: Label**
#   :::tip Text        → > **Tip: Text**
#   :::info            → (removed)
#   :::                → (removed)
#     :::              → (removed, indented closing)

for file in build/llms-full.txt build/llms.txt; do
  [ -f "$file" ] || continue

  sed -i \
    -e 's/^:::tip\[\(.*\)\]$/> **Tip: \1**/' \
    -e 's/^:::info\[\(.*\)\]$/> **Note: \1**/' \
    -e 's/^:::warning\[\(.*\)\]$/> **Warning: \1**/' \
    -e 's/^:::note\[\(.*\)\]$/> **Note: \1**/' \
    -e 's/^:::caution\[\(.*\)\]$/> **Caution: \1**/' \
    -e 's/^:::danger\[\(.*\)\]$/> **Danger: \1**/' \
    -e 's/^:::important\[\(.*\)\]$/> **Important: \1**/' \
    -e 's/^:::tip \(.*\)$/> **Tip: \1**/' \
    -e 's/^:::info \(.*\)$/> **Note: \1**/' \
    -e 's/^:::warning \(.*\)$/> **Warning: \1**/' \
    -e 's/^:::note \(.*\)$/> **Note: \1**/' \
    -e 's/^:::caution \(.*\)$/> **Caution: \1**/' \
    -e 's/^:::danger \(.*\)$/> **Danger: \1**/' \
    -e 's/^:::important \(.*\)$/> **Important: \1**/' \
    -e '/^[[:space:]]*:::tip$/d' \
    -e '/^[[:space:]]*:::info$/d' \
    -e '/^[[:space:]]*:::warning$/d' \
    -e '/^[[:space:]]*:::note$/d' \
    -e '/^[[:space:]]*:::caution$/d' \
    -e '/^[[:space:]]*:::danger$/d' \
    -e '/^[[:space:]]*:::important$/d' \
    -e '/^[[:space:]]*:::$/d' \
    "$file"

  # Fix URLs where the plugin fails to resolve Docusaurus routes
  sed -i \
    -e 's|docs/08-RegistryEvvm/04-AdminFunctions/02-_authorizeUpgrade|docs/RegistryEvvm/AdminFunctions/authorizeUpgrade|g' \
    "$file"

  echo "Cleaned $file"
done
