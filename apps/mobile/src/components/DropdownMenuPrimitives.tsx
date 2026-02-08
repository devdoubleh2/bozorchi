import React from "react";
import * as DropdownMenu from "zeego/dropdown-menu";
import { View } from "react-native";

export const DropdownMenuRoot = DropdownMenu.Root;

export const DropdownMenuTrigger = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.Trigger>) => (
    <DropdownMenu.Trigger {...props} asChild>
      <View aria-role="button">{props.children}</View>
    </DropdownMenu.Trigger>
  ),
  "Trigger"
);

export const DropdownMenuContent = DropdownMenu.Content;

export const DropdownMenuItem = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.Item>) => (
    <DropdownMenu.Item {...props} style={{ height: 44 }} />
  ),
  "Item"
);

export const DropdownMenuItemTitle = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.ItemTitle>) => (
    <DropdownMenu.ItemTitle {...props} />
  ),
  "ItemTitle"
);

export const DropdownMenuLabel = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.Label>) => (
    <DropdownMenu.Label {...props} />
  ),
  "Label"
);

export const DropdownMenuSeparator = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.Separator>) => (
    <DropdownMenu.Separator {...props} />
  ),
  "Separator"
);

export const DropdownMenuGroup = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.Group>) => (
    <DropdownMenu.Group {...props} />
  ),
  "Group"
);
