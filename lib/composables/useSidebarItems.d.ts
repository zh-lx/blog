import type { ComputedRef, InjectionKey } from 'vue';
import type { PageHeader } from '@vuepress/client';
import type { DefaultThemeData, DefaultThemePageFrontmatter, SidebarConfigArray, SidebarConfigObject, ResolvedSidebarItem } from '../types';
export declare type SidebarItemsRef = ComputedRef<ResolvedSidebarItem[]>;
export declare const sidebarItemsSymbol: InjectionKey<SidebarItemsRef>;
/**
 * Inject sidebar items global computed
 */
export declare const useSidebarItems: () => SidebarItemsRef;
/**
 * Resolve sidebar items global computed
 *
 * It should only be resolved and provided once
 */
export declare const resolveSidebarItems: (frontmatter: DefaultThemePageFrontmatter, themeLocale: DefaultThemeData) => ResolvedSidebarItem[];
/**
 * Util to transform page header to sidebar item
 */
export declare const headerToSidebarItem: (header: PageHeader) => ResolvedSidebarItem;
/**
 * Resolve sidebar items if the config is `auto`
 */
export declare const resolveAutoSidebarItems: () => ResolvedSidebarItem[];
/**
 * Resolve sidebar items if the config is an array
 */
export declare const resolveArraySidebarItems: (sidebarConfig: SidebarConfigArray) => ResolvedSidebarItem[];
/**
 * Resolve sidebar items if the config is a key -> value (path-prefix -> array) object
 */
export declare const resolveMultiSidebarItems: (sidebarConfig: SidebarConfigObject) => ResolvedSidebarItem[];
