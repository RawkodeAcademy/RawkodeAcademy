export const menuItems = [
    {
        title: "Home",
        exact: true,
        href: "/",
        icon: "mdi:home",
        regex: /^\/$/,
    },
    {
        title: "Shows",
        exact: false,
        href: "/shows",
        icon: "mdi:play-box-outline",
        regex: /^\/shows$/,
    }, {
        title: "Prices",
        exact: false,
        href: "/pricing",
        icon: "mdi:cash",
        regex: /^\/pricing$/,
    },
    {
        title: "Let's Collaborate",
        exact: false,
        href: "/work-together",
        icon: "mdi:account-box-outline",
        regex: /^\/work-together$/,
    },
];
