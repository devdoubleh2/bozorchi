import React from "react";
import * as DropdownMenu from "zeego/dropdown-menu";
import { View } from "react-native";

export const DropdownMenuRoot: typeof DropdownMenu.Root = DropdownMenu.Root;

type TriggerComponent = React.ComponentType<
  React.ComponentProps<typeof DropdownMenu.Trigger>
>;

export const DropdownMenuTrigger: TriggerComponent = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.Trigger>) => (
    <DropdownMenu.Trigger {...props} asChild>
      <View aria-role="button">{props.children}</View>
    </DropdownMenu.Trigger>
  ),
  "Trigger"
);

export const DropdownMenuContent: typeof DropdownMenu.Content =
  DropdownMenu.Content;

type ItemComponent = React.ComponentType<
  React.ComponentProps<typeof DropdownMenu.Item>
>;

export const DropdownMenuItem: ItemComponent = DropdownMenu.create(
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

type SeparatorComponent = React.ComponentType<
  React.ComponentProps<typeof DropdownMenu.Separator>
>;

export const DropdownMenuSeparator: SeparatorComponent = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.Separator>) => (
    <DropdownMenu.Separator {...props} />
  ),
  "Separator"
);

type GroupComponent = React.ComponentType<
  React.ComponentProps<typeof DropdownMenu.Group>
>;

export const DropdownMenuGroup: GroupComponent = DropdownMenu.create(
  (props: React.ComponentProps<typeof DropdownMenu.Group>) => (
    <DropdownMenu.Group {...props} />
  ),
  "Group"
);
