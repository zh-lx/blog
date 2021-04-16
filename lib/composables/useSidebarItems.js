import { inject } from 'vue';
import { useRoute } from 'vue-router';
import { usePageData } from '@vuepress/client';
import { isArray, isPlainObject, isString, resolveLocalePath, } from '@vuepress/shared';
import { useNavLink } from './useNavLink';
export const sidebarItemsSymbol = Symbol('sidebarItems');
/**
 * Inject sidebar items global computed
 */
export const useSidebarItems = () => {
    const sidebarItems = inject(sidebarItemsSymbol);
    if (!sidebarItems) {
        throw new Error('useSidebarItems() is called without provider.');
    }
    return sidebarItems;
};
/**
 * Resolve sidebar items global computed
 *
 * It should only be resolved and provided once
 */
export const resolveSidebarItems = (frontmatter, themeLocale) => {
    var _a, _b;
    // get sidebar config from frontmatter > themeConfig
    const sidebarConfig = (_b = (_a = frontmatter.sidebar) !== null && _a !== void 0 ? _a : themeLocale.sidebar) !== null && _b !== void 0 ? _b : 'auto';
    // resolve sidebar items according to the config
    if (frontmatter.home === true || sidebarConfig === false) {
        return [];
    }
    if (sidebarConfig === 'auto') {
        return resolveAutoSidebarItems();
    }
    if (isArray(sidebarConfig)) {
        return resolveArraySidebarItems(sidebarConfig);
    }
    if (isPlainObject(sidebarConfig)) {
        return resolveMultiSidebarItems(sidebarConfig);
    }
    return [];
};
/**
 * Util to transform page header to sidebar item
 */
export const headerToSidebarItem = (header) => ({
    text: header.title,
    link: `#${header.slug}`,
    children: header.children.map(headerToSidebarItem),
});
/**
 * Resolve sidebar items if the config is `auto`
 */
export const resolveAutoSidebarItems = () => {
    const page = usePageData();
    return [
        {
            isGroup: true,
            text: page.value.title,
            children: page.value.headers.map(headerToSidebarItem),
        },
    ];
};
/**
 * Resolve sidebar items if the config is an array
 */
export const resolveArraySidebarItems = (sidebarConfig) => {
    const route = useRoute();
    const page = usePageData();
    const handleChildItem = (item) => {
        let childItem;
        if (isString(item)) {
            childItem = useNavLink(item);
        }
        else {
            childItem = item;
        }
        if (childItem.isGroup && childItem.children) {
            return {
                ...childItem,
                children: childItem.children.map(handleChildItem),
            };
        }
        // if the sidebar item is current page and children is not set
        // use headers of current page as children
        if (childItem.link === route.path && childItem.children === undefined) {
            return {
                ...childItem,
                children: page.value.headers.map(headerToSidebarItem),
            };
        }
        return childItem;
    };
    return sidebarConfig.map((item) => {
        if (isString(item)) {
            return useNavLink(item);
        }
        if (!item.isGroup) {
            return item;
        }
        return {
            ...item,
            children: item.children.map(handleChildItem),
        };
    });
};
/**
 * Resolve sidebar items if the config is a key -> value (path-prefix -> array) object
 */
export const resolveMultiSidebarItems = (sidebarConfig) => {
    var _a;
    const route = useRoute();
    const sidebarPath = resolveLocalePath(sidebarConfig, route.path);
    const matchedSidebarConfig = (_a = sidebarConfig[sidebarPath]) !== null && _a !== void 0 ? _a : [];
    return resolveArraySidebarItems(matchedSidebarConfig);
};
