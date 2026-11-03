const JudasApp = {

    currentUser: null,
    currentProfile: null,

    root: document.getElementById("app"),

    // =====================================
    // INITIALIZE APPLICATION
    // =====================================

    async init() {

        if (!this.root) {
            console.error("Project Judas: #app element not found.");
            return;
        }

        this.showLoading();

        const session = await JudasAuth.getSession();

        if (session) {
            await this.loadUser(session.user);
        } else {
            this.showAuthentication();
        }

        JudasAuth.onAuthStateChange(async (event, session) => {

            if (event === "SIGNED_OUT") {
                this.currentUser = null;
                this.currentProfile = null;
                this.showAuthentication();
            }

            if (event === "SIGNED_IN" && session) {
                await this.loadUser(session.user);
            }

        });

    },


    // =====================================
    // LOADING SCREEN
    // =====================================

    showLoading() {

        this.root.innerHTML = `
            <div class="empty-state">
                <h2>PROJECT JUDAS</h2>
                <p>Connecting to secure servers...</p>

                <div class="loading">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

    },


    // =====================================
    // NOTIFICATION
    // =====================================

    notify(message) {

        const oldNotification = document.querySelector(".notification");

        if (oldNotification) {
            oldNotification.remove();
        }

        const notification = document.createElement("div");
        notification.className = "notification";
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3500);

    },


    // =====================================
    // AUTHENTICATION SCREEN
    // =====================================

    showAuthentication() {

        this.root.innerHTML = `
            <div style="
                width:100%;
                min-height:100vh;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:20px;
            ">

                <div class="form-container">

                    <div style="text-align:center;margin-bottom:30px;">
                        <h1 class="logo">PROJECT JUDAS</h1>

                        <p style="
                            color:var(--text-muted);
                            font-size:10px;
                            margin-top:12px;
                            letter-spacing:2px;
                        ">
                            SECURE COMMUNICATION NETWORK
                        </p>
                    </div>

                    <div id="auth-form"></div>

                </div>

            </div>
        `;

        this.showLoginForm();

    },


    // =====================================
    // LOGIN FORM
    // =====================================

    showLoginForm() {

        const form = document.getElementById("auth-form");

        form.innerHTML = `
            <h2 class="form-title">WELCOME BACK</h2>

            <p class="form-description">
                Sign in to access your Project Judas account.
            </p>

            <form id="login-form">

                <div class="form-group">
                    <label class="form-label">EMAIL ADDRESS</label>

                    <input
                        class="form-input"
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        autocomplete="email"
                        required
                    >
                </div>

                <div class="form-group">
                    <label class="form-label">PASSWORD</label>

                    <input
                        class="form-input"
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        autocomplete="current-password"
                        required
                    >
                </div>

                <p
                    id="login-error"
                    style="color:var(--danger);font-size:11px;margin-bottom:15px;"
                ></p>

                <button class="btn btn-primary" type="submit" style="width:100%;">
                    SIGN IN
                </button>

            </form>

            <p style="
                text-align:center;
                color:var(--text-muted);
                font-size:11px;
                margin-top:25px;
            ">
                Don't have an account?

                <button
                    id="show-register"
                    class="btn"
                    type="button"
                    style="margin-left:5px;"
                >
                    REGISTER
                </button>
            </p>
        `;

        document.getElementById("login-form").addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                const email = document.getElementById("login-email").value.trim();
                const password = document.getElementById("login-password").value;

                const button = event.currentTarget.querySelector("button[type='submit']");
                const errorBox = document.getElementById("login-error");

                button.disabled = true;
                button.textContent = "SIGNING IN...";

                const result = await JudasAuth.login(email, password);

                if (!result.success) {
                    errorBox.textContent = result.message;
                    button.disabled = false;
                    button.textContent = "SIGN IN";
                    return;
                }

                await this.loadUser(result.user);

            }
        );

        document.getElementById("show-register").addEventListener(
            "click",
            () => this.showRegisterForm()
        );

    },


    // =====================================
    // REGISTRATION FORM
    // =====================================

    showRegisterForm() {

        const form = document.getElementById("auth-form");

        form.innerHTML = `
            <h2 class="form-title">CREATE ACCOUNT</h2>

            <p class="form-description">
                Create your Project Judas account to get started.
            </p>

            <form id="register-form">

                <div class="form-group">
                    <label class="form-label">EMAIL ADDRESS</label>

                    <input
                        class="form-input"
                        id="register-email"
                        type="email"
                        placeholder="Enter your email"
                        autocomplete="email"
                        required
                    >
                </div>

                <div class="form-group">
                    <label class="form-label">PASSWORD</label>

                    <input
                        class="form-input"
                        id="register-password"
                        type="password"
                        placeholder="At least 8 characters"
                        minlength="8"
                        autocomplete="new-password"
                        required
                    >
                </div>

                <div class="form-group">
                    <label class="form-label">CONFIRM PASSWORD</label>

                    <input
                        class="form-input"
                        id="register-confirm"
                        type="password"
                        placeholder="Enter your password again"
                        minlength="8"
                        autocomplete="new-password"
                        required
                    >
                </div>

                <p
                    id="register-error"
                    style="color:var(--danger);font-size:11px;margin-bottom:15px;"
                ></p>

                <button class="btn btn-primary" type="submit" style="width:100%;">
                    CREATE ACCOUNT
                </button>

            </form>

            <p style="
                text-align:center;
                color:var(--text-muted);
                font-size:11px;
                margin-top:25px;
            ">
                Already registered?

                <button
                    id="show-login"
                    class="btn"
                    type="button"
                    style="margin-left:5px;"
                >
                    SIGN IN
                </button>
            </p>
        `;

        document.getElementById("register-form").addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                const email = document.getElementById("register-email").value.trim();
                const password = document.getElementById("register-password").value;
                const confirm = document.getElementById("register-confirm").value;

                const button = event.currentTarget.querySelector("button[type='submit']");
                const errorBox = document.getElementById("register-error");

                if (password !== confirm) {
                    errorBox.textContent = "Your passwords do not match.";
                    return;
                }

                button.disabled = true;
                button.textContent = "CREATING ACCOUNT...";

                const result = await JudasAuth.register(email, password);

                if (!result.success) {
                    errorBox.textContent = result.message;
                    button.disabled = false;
                    button.textContent = "CREATE ACCOUNT";
                    return;
                }

                if (result.session) {
                    await this.loadUser(result.user);
                    return;
                }

                form.innerHTML = `
                    <h2 class="form-title">CHECK YOUR EMAIL</h2>

                    <p class="form-description">
                        Your account has been created.

                        A confirmation link has been sent to:
                    </p>

                    <p style="
                        color:var(--green);
                        font-size:12px;
                        margin-bottom:20px;
                        overflow-wrap:anywhere;
                    "></p>

                    <p class="form-description">
                        Confirm your email, then return here and sign in.
                    </p>

                    <button
                        class="btn btn-primary"
                        id="return-login"
                        style="width:100%;"
                    >
                        RETURN TO LOGIN
                    </button>
                `;

                form.querySelector("p[style*='overflow-wrap']").textContent = email;

                document.getElementById("return-login").addEventListener(
                    "click",
                    () => this.showLoginForm()
                );

            }
        );

        document.getElementById("show-login").addEventListener(
            "click",
            () => this.showLoginForm()
        );

    },


    // =====================================
    // LOAD USER PROFILE
    // =====================================

    async loadUser(user) {

        if (!user) {
            this.showAuthentication();
            return;
        }

        this.currentUser = user;

        this.showLoading();

        let profile = null;

        for (let attempt = 0; attempt < 5; attempt++) {

            const { data, error } = await supabaseClient
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();

            if (error) {
                console.error("Profile loading error:", error);
                this.notify("Could not load your profile.");
                return;
            }

            if (data) {
                profile = data;
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 500));

        }

        if (!profile) {
            this.root.innerHTML = `
                <div class="empty-state">
                    <h2>PROFILE NOT FOUND</h2>
                    <p>Your account exists, but its profile could not be loaded.</p>
                </div>
            `;
            return;
        }

        this.currentProfile = profile;

        if (!profile.username) {
            this.showProfileSetup();
            return;
        }

        this.showDashboard();

    },


    // =====================================
    // FIRST-TIME PROFILE SETUP
    // =====================================

    showProfileSetup() {

        this.root.innerHTML = `
            <div style="
                width:100%;
                min-height:100vh;
                display:flex;
                justify-content:center;
                align-items:center;
                padding:20px;
                overflow-y:auto;
            ">

                <div class="form-container" style="max-width:500px;">

                    <h2 class="form-title">SET UP YOUR PROFILE</h2>

                    <p class="form-description">
                        Before entering Project Judas, choose how other users
                        will see you.
                    </p>

                    <form id="profile-setup-form">

                        <div class="form-group">
                            <label class="form-label">USERNAME</label>

                            <input
                                class="form-input"
                                id="profile-username"
                                type="text"
                                minlength="3"
                                maxlength="24"
                                pattern="[A-Za-z0-9_]+"
                                placeholder="Your unique username"
                                required
                            >

                            <p style="color:var(--text-muted);font-size:10px;margin-top:6px;">
                                3–24 characters. Letters, numbers, and underscores.
                            </p>
                        </div>

                        <div class="form-group">
                            <label class="form-label">DISPLAY NAME</label>

                            <input
                                class="form-input"
                                id="profile-display-name"
                                type="text"
                                maxlength="40"
                                placeholder="How should people see your name?"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label class="form-label">BIO</label>

                            <textarea
                                class="form-textarea"
                                id="profile-bio"
                                maxlength="300"
                                placeholder="Tell people a little about yourself..."
                            ></textarea>

                            <p style="color:var(--text-muted);font-size:10px;margin-top:6px;">
                                Maximum 300 characters.
                            </p>
                        </div>

                        <div class="form-group">
                            <label class="form-label">PRONOUNS (OPTIONAL)</label>

                            <input
                                class="form-input"
                                id="profile-pronouns"
                                type="text"
                                maxlength="40"
                                placeholder="e.g. they/them"
                            >
                        </div>

                        <div class="form-group">
                            <label class="form-label">PROFILE PICTURE (OPTIONAL)</label>

                            <input
                                class="form-input"
                                id="profile-avatar"
                                type="file"
                                accept="image/*"
                            >

                            <p style="color:var(--text-muted);font-size:10px;margin-top:6px;">
                                Maximum file size: 10 MB.
                            </p>
                        </div>

                        <p
                            id="profile-error"
                            style="color:var(--danger);font-size:11px;margin-bottom:15px;"
                        ></p>

                        <button
                            class="btn btn-primary"
                            type="submit"
                            style="width:100%;"
                        >
                            COMPLETE PROFILE
                        </button>

                    </form>

                </div>

            </div>
        `;

        document.getElementById("profile-setup-form").addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                const username = document.getElementById("profile-username").value.trim();
                const displayName = document.getElementById("profile-display-name").value.trim();
                const bio = document.getElementById("profile-bio").value.trim();
                const pronouns = document.getElementById("profile-pronouns").value.trim();
                const avatarInput = document.getElementById("profile-avatar");

                const errorBox = document.getElementById("profile-error");
                const button = event.currentTarget.querySelector("button[type='submit']");

                if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) {
                    errorBox.textContent = "Username must be 3–24 characters and use only letters, numbers, or underscores.";
                    return;
                }

                if (!displayName || displayName.length > 40) {
                    errorBox.textContent = "Please enter a display name (maximum 40 characters).";
                    return;
                }

                if (bio.length > 300 || pronouns.length > 40) {
                    errorBox.textContent = "Your bio or pronouns are too long.";
                    return;
                }

                const avatarFile = avatarInput.files[0];

                if (avatarFile) {

                    if (!avatarFile.type.startsWith("image/")) {
                        errorBox.textContent = "Please choose an image file.";
                        return;
                    }

                    if (avatarFile.size > 10 * 1024 * 1024) {
                        errorBox.textContent = "Your profile picture must be 10 MB or smaller.";
                        return;
                    }

                }

                button.disabled = true;
                button.textContent = "SAVING PROFILE...";

                let avatarPath = null;

                try {

                    if (avatarFile) {

                        const extension = avatarFile.name.split(".").pop().toLowerCase();

                        avatarPath = `${this.currentUser.id}/avatar.${extension}`;

                        const { error: uploadError } = await supabaseClient
                            .storage
                            .from("avatars")
                            .upload(avatarPath, avatarFile, {
                                upsert: true,
                                contentType: avatarFile.type
                            });

                        if (uploadError) {
                            throw uploadError;
                        }

                    }

                    const updates = {
                        username: username,
                        display_name: displayName,
                        bio: bio,
                        pronouns: pronouns,
                        avatar_url: avatarPath
                    };

                    const { data, error } = await supabaseClient
                        .from("profiles")
                        .update(updates)
                        .eq("id", this.currentUser.id)
                        .select()
                        .single();

                    if (error) {
                        throw error;
                    }

                    this.currentProfile = data;

                    this.notify("Profile created successfully!");

                    this.showDashboard();

                } catch (error) {

                    console.error("Profile setup error:", error);

                    if (error.code === "23505") {
                        errorBox.textContent = "That username is already taken. Please choose another.";
                    } else {
                        errorBox.textContent = error.message;
                    }

                    button.disabled = false;
                    button.textContent = "COMPLETE PROFILE";

                }

            }
        );

    },


    // =====================================
    // MAIN DASHBOARD
    // =====================================

    async showDashboard() {

        const profile = this.currentProfile;

        this.root.innerHTML = `
            <div class="app-container">

                <aside class="sidebar">

                    <div class="sidebar-header">
                        <div class="logo">JUDAS</div>
                        <div class="logo-subtitle">COMMUNICATION NETWORK</div>
                    </div>

                    <nav class="sidebar-navigation">

                        <div class="nav-label">COMMUNICATION</div>

                        <button class="nav-item active" data-page="messages">
                            <span class="nav-icon">✉</span>
                            <span class="nav-text">Messages</span>
                        </button>

                        <button class="nav-item" data-page="groups">
                            <span class="nav-icon">▣</span>
                            <span class="nav-text">Group Chats</span>
                        </button>

                        <button class="nav-item" data-page="users">
                            <span class="nav-icon">⌕</span>
                            <span class="nav-text">Find Users</span>
                        </button>

                        <div class="nav-label">OTHER</div>

                        <button class="nav-item" data-page="announcements">
                            <span class="nav-icon">▤</span>
                            <span class="nav-text">Announcements</span>
                        </button>

                        <button class="nav-item" data-page="profile">
                            <span class="nav-icon">◉</span>
                            <span class="nav-text">Profile</span>
                        </button>

                        <button class="nav-item" data-page="settings">
                            <span class="nav-icon">⚙</span>
                            <span class="nav-text">Settings</span>
                        </button>

                    </nav>

                    <div class="sidebar-footer">

                        <div class="user-mini">

                            <div class="avatar" id="sidebar-avatar">
                                ${this.escapeHTML(profile.display_name || profile.username).charAt(0).toUpperCase()}
                            </div>

                            <div class="user-mini-info">

                                <div class="user-mini-name" id="sidebar-name"></div>

                                <div class="user-mini-status">
                                    <span class="status-dot"></span>
                                    ONLINE
                                </div>

                            </div>

                        </div>

                        <button
                            class="btn btn-danger"
                            id="logout-button"
                            style="width:100%;margin-top:10px;"
                        >
                            LOG OUT
                        </button>

                    </div>

                </aside>

                <main class="main-content">

                    <header class="page-header">

                        <div>
                            <div class="page-title" id="page-title">MESSAGES</div>

                            <div class="page-subtitle">
                                PROJECT JUDAS / SECURE CONNECTION
                            </div>
                        </div>

                    </header>

                    <section id="page-content" style="
                        flex:1;
                        min-height:0;
                        overflow:auto;
                        display:flex;
                        flex-direction:column;
                    ">

                        <div class="empty-state">
                            <h2>WELCOME TO PROJECT JUDAS</h2>
                            <p>
                                Your account is ready. Messaging features
                                will appear here as we build them.
                            </p>
                        </div>

                    </section>

                </main>

            </div>
        `;

        const avatar = document.getElementById("sidebar-avatar");

        if (profile.avatar_url) {

            const { data, error } = await supabaseClient
                .storage
                .from("avatars")
                .createSignedUrl(profile.avatar_url, 3600);

            if (!error && data) {

                const image = document.createElement("img");
                image.src = data.signedUrl;
                image.alt = "Profile picture";

                avatar.textContent = "";
                avatar.appendChild(image);

            }

        }

        document.getElementById("sidebar-name").textContent =
            profile.display_name || profile.username;

        document.getElementById("logout-button").addEventListener(
            "click",
            async () => {

                const result = await JudasAuth.logout();

                if (!result.success) {
                    this.notify(result.message);
                }

            }
        );

        document.querySelectorAll(".nav-item").forEach(button => {

            button.addEventListener("click", () => {

                document.querySelectorAll(".nav-item").forEach(item => {
                    item.classList.remove("active");
                });

                button.classList.add("active");

                const page = button.dataset.page;

                const titles = {
                    messages: "MESSAGES",
                    groups: "GROUP CHATS",
                    users: "FIND USERS",
                    announcements: "ANNOUNCEMENTS",
                    profile: "PROFILE",
                    settings: "SETTINGS"
                };

                document.getElementById("page-title").textContent =
                    titles[page] || "PROJECT JUDAS";

                document.getElementById("page-content").innerHTML = `
                    <div class="empty-state">
                        <h2>${this.escapeHTML(titles[page] || "PROJECT JUDAS")}</h2>
                        <p>This section is being built.</p>
                    </div>
                `;

            });

        });

    },


    // =====================================
    // SAFE HTML TEXT
    // =====================================

    escapeHTML(value) {

        return String(value ?? "").replace(/[&<>"']/g, character => {

            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return entities[character];

        });

    }

};


// =========================================
// START PROJECT JUDAS
// =========================================

window.JudasApp = JudasApp;

document.addEventListener("DOMContentLoaded", () => {
    JudasApp.init();
});
