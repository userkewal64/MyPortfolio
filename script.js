if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
}

const startAtHome = () => {
    if (window.location.hash) {
        window.history.replaceState(
            window.history.state,
            "",
            `${window.location.pathname}${window.location.search}`
        );
    }

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previousScrollBehavior;
};

startAtHome();
window.addEventListener("pageshow", startAtHome);

const reducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll("[data-reveal]");
const navLinks = [...document.querySelectorAll(".navbar a[href^='#']")];
const navbar = document.querySelector(".navbar");
const currentYear = document.querySelector("[data-current-year]");

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

if (!reducedMotion && "IntersectionObserver" in window && revealItems.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => revealObserver.observe(item));
    document.documentElement.classList.add("reveal-ready");
}

if (navLinks.length > 0) {
    const sections = navLinks
        .map((link) => document.querySelector(link.hash))
        .filter((section) => section !== null);

    let navigationFramePending = false;
    const setActiveNavigation = (activeSection) => {
        let activeLink = null;
        navLinks.forEach((link) => {
            const isActive = link.hash === `#${activeSection.id}`;
            link.classList.toggle("active", isActive);
            if (isActive) {
                activeLink = link;
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        if (navbar && activeLink) {
            navbar.style.setProperty("--active-indicator-x", `${activeLink.offsetLeft}px`);
            navbar.style.setProperty("--active-indicator-width", `${activeLink.offsetWidth}px`);
        }
    };

    const updateActiveNavigation = () => {
        navigationFramePending = false;
        if (sections.length === 0) {
            return;
        }

        const isNearPageEnd = window.scrollY + window.innerHeight >=
            document.documentElement.scrollHeight - 160;
        const activationLine = window.innerHeight * 0.32;
        let activeSection = sections[0];

        if (isNearPageEnd) {
            activeSection = sections[sections.length - 1];
        } else {
            sections.forEach((section) => {
                if (section.getBoundingClientRect().top <= activationLine) {
                    activeSection = section;
                }
            });
        }

        setActiveNavigation(activeSection);
    };

    const updateNavigationFromHash = () => {
        const activeSection = sections.find((section) => `#${section.id}` === window.location.hash);
        if (activeSection) {
            setActiveNavigation(activeSection);
        }
    };

    const scheduleNavigationUpdate = () => {
        if (navigationFramePending) {
            return;
        }

        navigationFramePending = true;
        window.requestAnimationFrame(updateActiveNavigation);
    };

    window.addEventListener("scroll", scheduleNavigationUpdate, { passive: true });
    window.addEventListener("resize", scheduleNavigationUpdate);
    window.addEventListener("hashchange", updateNavigationFromHash);
    updateNavigationFromHash();
    scheduleNavigationUpdate();
}

const gmailLink = document.querySelector(".contact-method--gmail");
const gmailCopyMenu = document.querySelector("#gmail-copy-menu");
const copyEmailButton = document.querySelector("[data-copy-email]");
const copyEmailStatus = document.querySelector("#gmail-copy-status");

if (gmailLink && gmailCopyMenu && copyEmailButton && copyEmailStatus) {
    let longPressTimer = null;
    let suppressGmailClick = false;

    const clearLongPressTimer = () => {
        if (longPressTimer !== null) {
            window.clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    };

    const closeGmailCopyMenu = (restoreFocus = false) => {
        gmailCopyMenu.hidden = true;
        suppressGmailClick = false;
        if (restoreFocus) {
            gmailLink.focus();
        }
    };

    const openGmailCopyMenu = (x, y) => {
        gmailCopyMenu.hidden = false;
        const menuBounds = gmailCopyMenu.getBoundingClientRect();
        const margin = 8;
        const left = Math.max(margin, Math.min(x, window.innerWidth - menuBounds.width - margin));
        const top = Math.max(margin, Math.min(y, window.innerHeight - menuBounds.height - margin));
        gmailCopyMenu.style.left = `${left}px`;
        gmailCopyMenu.style.top = `${top}px`;
        copyEmailButton.focus();
    };

    gmailLink.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        openGmailCopyMenu(event.clientX, event.clientY);
    });

    gmailLink.addEventListener("keydown", (event) => {
        if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
            event.preventDefault();
            const linkBounds = gmailLink.getBoundingClientRect();
            openGmailCopyMenu(linkBounds.left, linkBounds.bottom);
        }
    });

    gmailLink.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "touch") {
            return;
        }

        clearLongPressTimer();
        suppressGmailClick = false;
        const { clientX, clientY } = event;
        longPressTimer = window.setTimeout(() => {
            longPressTimer = null;
            suppressGmailClick = true;
            openGmailCopyMenu(clientX, clientY);
        }, 550);
    });

    gmailLink.addEventListener("pointerup", clearLongPressTimer);
    gmailLink.addEventListener("pointercancel", clearLongPressTimer);
    gmailLink.addEventListener("pointermove", clearLongPressTimer);
    gmailLink.addEventListener("click", (event) => {
        clearLongPressTimer();
        if (suppressGmailClick) {
            event.preventDefault();
            suppressGmailClick = false;
            return;
        }
        closeGmailCopyMenu();
    });

    document.addEventListener("click", (event) => {
        if (!suppressGmailClick) {
            return;
        }

        suppressGmailClick = false;
        if (gmailLink.contains(event.target)) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);

    document.addEventListener("pointerdown", (event) => {
        if (!gmailCopyMenu.hidden &&
            !gmailCopyMenu.contains(event.target) &&
            !gmailLink.contains(event.target)) {
            closeGmailCopyMenu();
        }
    });

    gmailCopyMenu.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            closeGmailCopyMenu(true);
        }
    });

    window.addEventListener("resize", () => closeGmailCopyMenu());
    window.addEventListener("scroll", () => closeGmailCopyMenu(), { passive: true });

    copyEmailButton.addEventListener("click", async () => {
        copyEmailStatus.textContent = "";
        copyEmailStatus.removeAttribute("data-state");

        try {
            if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
                throw new Error("Clipboard API is unavailable.");
            }

            await navigator.clipboard.writeText(copyEmailButton.dataset.copyEmail);
            copyEmailStatus.dataset.state = "success";
            copyEmailStatus.textContent = "Gmail address copied!";
        } catch (error) {
            console.error("Unable to copy the Gmail address to the clipboard.", error);
            copyEmailStatus.dataset.state = "error";
            copyEmailStatus.textContent = "Could not copy the Gmail address. Check clipboard permissions and try again.";
        } finally {
            closeGmailCopyMenu(true);
        }
    });
}
