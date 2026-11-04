
const JudasApp = {
    currentUser: null,
    currentProfile: null,
    currentConversation: null,
    messageChannel: null,
    root: document.getElementById("app"),

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
                await this.closeMessageSubscription();
                this.currentUser = null;
                this.currentProfile = null;
                this.currentConversation = null;
                this.showAuthentication();
            }

            if (event === "SIGNED_IN" && session) {
                await this.loadUser(session.user);
            }
        });
    },

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

    async closeMessageSubscription() {
        if (this.messageChannel) {
            await supabaseClient.removeChannel(this.messageChannel);
            this.messageChannel = null;
        }
    },

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

        document.getElementById("login-form").addEventListener("submit", async event => {
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
        });

        document.getElementById("show-register").addEventListener(
            "click",
            () => this.showRegisterForm()
        );
    },

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

        document.getElementById("register-form").addEventListener("submit", async event => {
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
        });

        document.getElementById("show-login").addEventListener(
            "click",
            () => this.showLoginForm()
        );
    },

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

        await this.showDashboard();
    },

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

        document.getElementById("profile-setup-form").addEventListener("submit", async event => {
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
                    username,
                    display_name: displayName,
                    bio,
                    pronouns,
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
                await this.showDashboard();

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
        });
    },

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
                    "></section>
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

        document.getElementById("logout-button").addEventListener("click", async () => {
            const result = await JudasAuth.logout();

            if (!result.success) {
                this.notify(result.message);
            }
        });

        document.querySelectorAll(".nav-item").forEach(button => {
            button.addEventListener("click", async () => {
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

                if (page !== "messages") {
                    await this.closeMessageSubscription();
                    this.currentConversation = null;
                }

                if (page === "messages") {
                    await this.showMessages();
                    return;
                }

                if (page === "users") {
                    this.showFindUsers();
                    return;
                }

                document.getElementById("page-content").innerHTML = `
                    <div class="empty-state">
                        <h2>${this.escapeHTML(titles[page] || "PROJECT JUDAS")}</h2>
                        <p>This section is being built.</p>
                    </div>
                `;
            });
        });

        await this.showMessages();
    },

    async showMessages() {
        await this.closeMessageSubscription();
        this.currentConversation = null;

        const content = document.getElementById("page-content");

        if (!content) return;

        content.innerHTML = `
            <div style="
                width:100%;
                max-width:900px;
                margin:0 auto;
                padding:25px;
            ">
                <div style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:15px;
                    margin-bottom:20px;
                ">
                    <div>
                        <h2 class="form-title">YOUR MESSAGES</h2>
                        <p class="form-description">
                            Your private conversations.
                        </p>
                    </div>

                    <button class="btn" id="refresh-conversations">
                        REFRESH
                    </button>
                </div>

                <div id="conversation-list">
                    <div class="empty-state">
                        <h2>LOADING MESSAGES</h2>
                        <p>Retrieving your conversations...</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById("refresh-conversations").addEventListener(
            "click",
            () => this.loadConversations()
        );

        await this.loadConversations();
    },

    async loadConversations() {
        const container = document.getElementById("conversation-list");

        if (!container || !this.currentUser) return;

        container.innerHTML = `
            <div class="empty-state">
                <h2>LOADING</h2>
                <p>Retrieving your conversations...</p>
            </div>
        `;

        try {
            const { data: memberships, error: membershipError } = await supabaseClient
                .from("conversation_members")
                .select("conversation_id")
                .eq("user_id", this.currentUser.id);

            if (membershipError) {
                throw membershipError;
            }

            if (!memberships || memberships.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h2>NO CONVERSATIONS</h2>
                        <p>Visit Find Users and select someone to start a conversation.</p>
                    </div>
                `;
                return;
            }

            const conversationIds = memberships.map(item => item.conversation_id);

            const { data: conversations, error: conversationError } = await supabaseClient
                .from("conversations")
                .select("id, type, name, created_at")
                .in("id", conversationIds)
                .order("created_at", { ascending: false });

            if (conversationError) {
                throw conversationError;
            }

            const conversationDetails = await Promise.all(
                conversations.map(async conversation => {
                    const { data: members, error: membersError } = await supabaseClient
                        .from("conversation_members")
                        .select("user_id")
                        .eq("conversation_id", conversation.id);

                    if (membersError) {
                        throw membersError;
                    }

                    const otherMember = members.find(
                        member => member.user_id !== this.currentUser.id
                    );

                    let otherProfile = null;

                    if (otherMember) {
                        const { data: profile, error: profileError } = await supabaseClient
                            .from("profiles")
                            .select("id, username, display_name, avatar_url")
                            .eq("id", otherMember.user_id)
                            .maybeSingle();

                        if (profileError) {
                            throw profileError;
                        }

                        otherProfile = profile;
                    }

                    const { data: latestMessage, error: messageError } = await supabaseClient
                        .from("messages")
                        .select("body, created_at, sender_id")
                        .eq("conversation_id", conversation.id)
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (messageError) {
                        throw messageError;
                    }

                    return {
                        conversation,
                        otherProfile,
                        latestMessage
                    };
                })
            );

            conversationDetails.sort((a, b) => {
                const aDate = a.latestMessage?.created_at || a.conversation.created_at;
                const bDate = b.latestMessage?.created_at || b.conversation.created_at;

                return new Date(bDate) - new Date(aDate);
            });

            container.innerHTML = "";

            for (const item of conversationDetails) {
                const card = document.createElement("button");
                card.type = "button";
                card.style.cssText = `
                    width:100%;
                    display:flex;
                    align-items:center;
                    gap:14px;
                    padding:14px;
                    margin-bottom:10px;
                    background:var(--surface);
                    border:1px solid var(--border);
                    color:var(--text);
                    text-align:left;
                    cursor:pointer;
                    font-family:inherit;
                `;

                const avatar = document.createElement("div");
                avatar.className = "avatar";
                avatar.style.cssText = `
                    width:48px;
                    height:48px;
                    min-width:48px;
                    font-size:16px;
                `;

                const displayName = item.otherProfile
                    ? item.otherProfile.display_name || item.otherProfile.username
                    : item.conversation.name || "UNKNOWN CONVERSATION";

                avatar.textContent = displayName.charAt(0).toUpperCase();

                if (item.otherProfile?.avatar_url) {
                    const { data } = await supabaseClient
                        .storage
                        .from("avatars")
                        .createSignedUrl(item.otherProfile.avatar_url, 3600);

                    if (data) {
                        const image = document.createElement("img");
                        image.src = data.signedUrl;
                        image.alt = "Profile picture";
                        avatar.textContent = "";
                        avatar.appendChild(image);
                    }
                }

                const info = document.createElement("div");
                info.style.cssText = "flex:1;min-width:0;";

                const name = document.createElement("div");
                name.style.cssText = "font-size:12px;color:var(--text);";
                name.textContent = displayName;

                const username = document.createElement("div");
                username.style.cssText = "font-size:9px;color:var(--green);margin-top:4px;";
                username.textContent = item.otherProfile
                    ? "@" + item.otherProfile.username
                    : "GROUP CONVERSATION";

                const preview = document.createElement("div");
                preview.style.cssText = `
                    font-size:10px;
                    color:var(--text-muted);
                    margin-top:7px;
                    overflow:hidden;
                    text-overflow:ellipsis;
                    white-space:nowrap;
                `;

                if (item.latestMessage) {
                    const prefix = item.latestMessage.sender_id === this.currentUser.id
                        ? "YOU: "
                        : "";

                    preview.textContent = prefix + item.latestMessage.body;
                } else {
                    preview.textContent = "No messages yet.";
                }

                info.append(name, username, preview);
                card.append(avatar, info);

                card.addEventListener("click", () => {
                    this.openConversation(item.conversation.id);
                });

                container.appendChild(card);
            }

            if (conversationDetails.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h2>NO CONVERSATIONS</h2>
                        <p>Visit Find Users and select someone to start a conversation.</p>
                    </div>
                `;
            }

        } catch (error) {
            console.error("Conversation loading error:", error);

            container.innerHTML = `
                <div class="empty-state">
                    <h2>COULD NOT LOAD MESSAGES</h2>
                    <p>${this.escapeHTML(error.message || "An unexpected error occurred.")}</p>
                    <button class="btn" id="retry-conversations">TRY AGAIN</button>
                </div>
            `;

            document.getElementById("retry-conversations")?.addEventListener(
                "click",
                () => this.loadConversations()
            );
        }
    },

    async startDirectMessage(targetUserId) {
        if (!this.currentUser || !targetUserId) {
            this.notify("Could not start this conversation.");
            return;
        }

        if (targetUserId === this.currentUser.id) {
            this.notify("You cannot message yourself.");
            return;
        }

        const button = document.getElementById("start-direct-message");

        if (button) {
            button.disabled = true;
            button.textContent = "OPENING...";
        }

        try {
            const { data, error } = await supabaseClient.rpc(
                "create_direct_conversation",
                {
                    target_user_id: targetUserId
                }
            );

            if (error) {
                throw error;
            }

            if (!data) {
                throw new Error("The conversation could not be created.");
            }

            await this.openConversation(data);

        } catch (error) {
            console.error("Direct message creation error:", error);
            this.notify(error.message || "Could not start the conversation.");

            if (button) {
                button.disabled = false;
                button.textContent = "MESSAGE";
            }
        }
    },

    async openConversation(conversationId) {
        await this.closeMessageSubscription();

        this.currentConversation = conversationId;

        const content = document.getElementById("page-content");

        if (!content) return;

        content.innerHTML = `
            <div style="
                width:100%;
                max-width:1000px;
                margin:0 auto;
                padding:20px;
                display:flex;
                flex-direction:column;
                flex:1;
                min-height:0;
            ">
                <div style="
                    display:flex;
                    align-items:center;
                    gap:12px;
                    padding-bottom:15px;
                    border-bottom:1px solid var(--border);
                    margin-bottom:15px;
                ">
                    <button class="btn" id="back-to-messages">
                        &lt; BACK
                    </button>

                    <div style="min-width:0;flex:1;">
                        <div
                            id="conversation-title"
                            style="font-size:13px;color:var(--green);"
                        >
                            LOADING CONVERSATION...
                        </div>

                        <div
                            id="conversation-subtitle"
                            style="font-size:9px;color:var(--text-muted);margin-top:5px;"
                        ></div>
                    </div>

                    <button class="btn" id="refresh-messages">
                        REFRESH
                    </button>
                </div>

                <div
                    id="message-list"
                    style="
                        flex:1;
                        min-height:200px;
                        overflow-y:auto;
                        display:flex;
                        flex-direction:column;
                        gap:12px;
                        padding:10px 5px 20px;
                    "
                >
                    <div class="empty-state">
                        <h2>LOADING MESSAGES</h2>
                    </div>
                </div>

                <form
                    id="message-form"
                    style="
                        display:flex;
                        gap:10px;
                        align-items:flex-end;
                        border-top:1px solid var(--border);
                        padding-top:15px;
                    "
                >
                    <textarea
                        id="message-input"
                        class="form-textarea"
                        maxlength="5000"
                        rows="2"
                        placeholder="Write a message..."
                        style="flex:1;resize:vertical;min-height:55px;"
                        required
                    ></textarea>

                    <button
                        class="btn btn-primary"
                        id="send-message-button"
                        type="submit"
                        style="min-height:45px;"
                    >
                        SEND
                    </button>
                </form>
            </div>
        `;

        document.getElementById("back-to-messages").addEventListener(
            "click",
            () => this.showMessages()
        );

        document.getElementById("refresh-messages").addEventListener(
            "click",
            () => this.loadMessages(conversationId)
        );

        document.getElementById("message-form").addEventListener(
            "submit",
            event => this.sendMessage(event, conversationId)
        );

        try {
            const { data: members, error: membersError } = await supabaseClient
                .from("conversation_members")
                .select("user_id")
                .eq("conversation_id", conversationId);

            if (membersError) {
                throw membersError;
            }

            const otherMember = members.find(
                member => member.user_id !== this.currentUser.id
            );

            let otherProfile = null;

            if (otherMember) {
                const { data, error } = await supabaseClient
                    .from("profiles")
                    .select("username, display_name")
                    .eq("id", otherMember.user_id)
                    .maybeSingle();

                if (error) {
                    throw error;
                }

                otherProfile = data;
            }

            const title = document.getElementById("conversation-title");
            const subtitle = document.getElementById("conversation-subtitle");

            if (title && subtitle) {
                title.textContent = otherProfile
                    ? otherProfile.display_name || otherProfile.username
                    : "CONVERSATION";

                subtitle.textContent = otherProfile
                    ? "@" + otherProfile.username
                    : "PROJECT JUDAS";
            }

            await this.loadMessages(conversationId);
            this.subscribeToMessages(conversationId);

        } catch (error) {
            console.error("Opening conversation error:", error);
            this.notify("Could not open this conversation: " + error.message);
        }
    },

    async loadMessages(conversationId) {
        const container = document.getElementById("message-list");

        if (!container || this.currentConversation !== conversationId) return;

        try {
            const { data, error } = await supabaseClient
                .from("messages")
                .select("id, conversation_id, sender_id, body, created_at")
                .eq("conversation_id", conversationId)
                .order("created_at", { ascending: true })
                .limit(200);

            if (error) {
                throw error;
            }

            if (this.currentConversation !== conversationId) return;

            container.innerHTML = "";

            if (!data || data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="min-height:150px;">
                        <h2>NO MESSAGES YET</h2>
                        <p>Send the first message to begin this conversation.</p>
                    </div>
                `;
                return;
            }

            for (const message of data) {
                const ownMessage = message.sender_id === this.currentUser.id;

                const wrapper = document.createElement("div");
                wrapper.style.cssText = `
                    display:flex;
                    flex-direction:column;
                    align-items:${ownMessage ? "flex-end" : "flex-start"};
                    width:100%;
                `;

                const bubble = document.createElement("div");
                bubble.style.cssText = `
                    max-width:75%;
                    min-width:80px;
                    padding:11px 13px;
                    background:${ownMessage ? "var(--surface-light)" : "var(--surface)"};
                    border:1px solid ${ownMessage ? "var(--green)" : "var(--border)"};
                    color:var(--text);
                    font-size:11px;
                    line-height:1.6;
                    overflow-wrap:anywhere;
                    white-space:pre-wrap;
                `;
                bubble.textContent = message.body;

                const timestamp = document.createElement("div");
                timestamp.style.cssText = `
                    color:var(--text-dim);
                    font-size:8px;
                    margin-top:5px;
                `;

                timestamp.textContent =
                    (ownMessage ? "YOU · " : "THEM · ") +
                    new Date(message.created_at).toLocaleString();

                wrapper.append(bubble, timestamp);
                container.appendChild(wrapper);
            }

            container.scrollTop = container.scrollHeight;

        } catch (error) {
            console.error("Message loading error:", error);

            container.innerHTML = `
                <div class="empty-state">
                    <h2>MESSAGE ERROR</h2>
                    <p>${this.escapeHTML(error.message || "Could not retrieve messages.")}</p>
                </div>
            `;
        }
    },

    async sendMessage(event, conversationId) {
        event.preventDefault();

        if (this.currentConversation !== conversationId) return;

        const input = document.getElementById("message-input");
        const button = document.getElementById("send-message-button");

        if (!input || !button) return;

        const body = input.value.trim();

        if (!body) return;

        if (body.length > 5000) {
            this.notify("Messages cannot exceed 5,000 characters.");
            return;
        }

        button.disabled = true;
        button.textContent = "SENDING...";

        try {
            const { error } = await supabaseClient
                .from("messages")
                .insert({
                    conversation_id: conversationId,
                    sender_id: this.currentUser.id,
                    body
                });

            if (error) {
                throw error;
            }

            input.value = "";
            await this.loadMessages(conversationId);

        } catch (error) {
            console.error("Message sending error:", error);
            this.notify("Message could not be sent: " + error.message);
        }

        button.disabled = false;
        button.textContent = "SEND";
        input.focus();
    },

    subscribeToMessages(conversationId) {
        this.messageChannel = supabaseClient
            .channel("messages-" + conversationId)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: "conversation_id=eq." + conversationId
                },
                () => {
                    if (this.currentConversation === conversationId) {
                        this.loadMessages(conversationId);
                    }
                }
            )
            .subscribe(status => {
                if (status === "CHANNEL_ERROR") {
                    console.error("Message realtime connection failed.");
                }
            });
    },

    showFindUsers() {
        const content = document.getElementById("page-content");

        if (!content) return;

        content.innerHTML = `
            <div style="
                width:100%;
                max-width:850px;
                margin:0 auto;
                padding:25px;
            ">
                <div style="margin-bottom:25px;">
                    <h2 class="form-title">FIND USERS</h2>

                    <p class="form-description" style="margin-bottom:15px;">
                        Search the Project Judas network for other users.
                    </p>

                    <input
                        type="search"
                        class="chat-search"
                        id="user-search"
                        placeholder="Search by username or display name..."
                        autocomplete="off"
                        maxlength="40"
                    >

                    <p style="
                        color:var(--text-dim);
                        font-size:9px;
                        margin-top:8px;
                    ">
                        ENTER A USERNAME OR DISPLAY NAME TO BEGIN SEARCHING.
                    </p>
                </div>

                <div
                    id="user-search-status"
                    style="
                        color:var(--text-muted);
                        font-size:10px;
                        margin-bottom:15px;
                    "
                >
                    READY TO SEARCH.
                </div>

                <div
                    id="user-search-results"
                    style="
                        display:flex;
                        flex-direction:column;
                        gap:10px;
                    "
                >
                    <div class="empty-state" style="min-height:180px;">
                        <h2>USER DIRECTORY</h2>
                        <p>Search for someone to see their profile.</p>
                    </div>
                </div>
            </div>
        `;

        const searchInput = document.getElementById("user-search");

        let searchTimeout = null;
        let searchVersion = 0;

        searchInput.addEventListener("input", () => {
            clearTimeout(searchTimeout);

            const query = searchInput.value.trim();
            searchVersion++;

            if (!query) {
                this.renderUserSearchMessage(
                    "USER DIRECTORY",
                    "Search for someone to see their profile."
                );

                document.getElementById("user-search-status").textContent =
                    "READY TO SEARCH.";

                return;
            }

            if (query.length < 2) {
                this.renderUserSearchMessage(
                    "KEEP TYPING",
                    "Enter at least 2 characters to search."
                );

                document.getElementById("user-search-status").textContent =
                    "SEARCH REQUIRES 2 CHARACTERS.";

                return;
            }

            const currentVersion = searchVersion;

            document.getElementById("user-search-status").textContent =
                "SEARCHING NETWORK...";

            this.renderUserSearchMessage(
                "SEARCHING",
                "Looking for matching users..."
            );

            searchTimeout = setTimeout(async () => {
                await this.searchUsers(
                    query,
                    currentVersion,
                    () => searchVersion
                );
            }, 350);
        });

        searchInput.focus();
    },

    async searchUsers(query, version, getCurrentVersion) {
        const resultsContainer = document.getElementById("user-search-results");
        const status = document.getElementById("user-search-status");

        if (!resultsContainer || !status) return;

        const safeQuery = query
            .replace(/[%_\\]/g, character => "\\" + character)
            .replace(/,/g, "");

        try {
            const { data, error } = await supabaseClient
                .from("profiles")
                .select("id, username, display_name, bio, pronouns, avatar_url")
                .or(
                    `username.ilike.%${safeQuery}%,display_name.ilike.%${safeQuery}%`
                )
                .neq("id", this.currentUser.id)
                .order("username", { ascending: true })
                .limit(25);

            if (version !== getCurrentVersion()) return;

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                status.textContent = "SEARCH COMPLETE. 0 RESULTS.";

                this.renderUserSearchMessage(
                    "NO USERS FOUND",
                    "Try another username or display name."
                );

                return;
            }

            status.textContent =
                `SEARCH COMPLETE. ${data.length} USER${data.length === 1 ? "" : "S"} FOUND.`;

            await this.renderUserResults(data, version, getCurrentVersion);

        } catch (error) {
            console.error("User search error:", error);

            if (version !== getCurrentVersion()) return;

            status.textContent = "SEARCH FAILED.";

            this.renderUserSearchMessage(
                "CONNECTION ERROR",
                "Could not search the user directory. Please try again."
            );
        }
    },

    async renderUserResults(users, version, getCurrentVersion) {
        const container = document.getElementById("user-search-results");

        if (!container) return;

        container.innerHTML = "";

        for (const user of users) {
            let avatarUrl = null;

            if (user.avatar_url) {
                const { data, error } = await supabaseClient
                    .storage
                    .from("avatars")
                    .createSignedUrl(user.avatar_url, 3600);

                if (!error && data) {
                    avatarUrl = data.signedUrl;
                }
            }

            if (version !== getCurrentVersion()) return;

            const card = document.createElement("div");

            card.style.cssText = `
                display:flex;
                align-items:center;
                gap:15px;
                padding:15px;
                background:var(--surface);
                border:1px solid var(--border);
                min-width:0;
            `;

            const avatar = document.createElement("div");
            avatar.className = "avatar";
            avatar.style.cssText = `
                width:52px;
                height:52px;
                min-width:52px;
                font-size:18px;
            `;

            if (avatarUrl) {
                const image = document.createElement("img");
                image.src = avatarUrl;
                image.alt = "Profile picture";
                avatar.appendChild(image);
            } else {
                avatar.textContent = (
                    user.display_name || user.username || "?"
                ).charAt(0).toUpperCase();
            }

            const info = document.createElement("div");
            info.style.cssText = "flex:1;min-width:0;";

            const displayName = document.createElement("div");
            displayName.style.cssText = `
                color:var(--text);
                font-size:12px;
                overflow-wrap:anywhere;
            `;
            displayName.textContent = user.display_name || user.username;

            const username = document.createElement("div");
            username.style.cssText = `
                color:var(--green);
                font-size:10px;
                margin-top:4px;
                overflow-wrap:anywhere;
            `;
            username.textContent = "@" + user.username;

            const bio = document.createElement("div");
            bio.style.cssText = `
                color:var(--text-muted);
                font-size:9px;
                margin-top:7px;
                overflow-wrap:anywhere;
            `;
            bio.textContent = user.bio || "No bio provided.";

            const pronouns = document.createElement("div");
            pronouns.style.cssText = `
                color:var(--text-dim);
                font-size:9px;
                margin-top:5px;
            `;
            pronouns.textContent = user.pronouns || "";

            info.append(displayName, username, bio);

            if (user.pronouns) {
                info.appendChild(pronouns);
            }

            const viewButton = document.createElement("button");
            viewButton.className = "btn";
            viewButton.textContent = "VIEW";
            viewButton.type = "button";

            viewButton.addEventListener("click", () => {
                this.showPublicProfile(user);
            });

            card.append(avatar, info, viewButton);
            container.appendChild(card);
        }
    },

    renderUserSearchMessage(title, message) {
        const container = document.getElementById("user-search-results");

        if (!container) return;

        container.innerHTML = `
            <div class="empty-state" style="min-height:180px;">
                <h2>${this.escapeHTML(title)}</h2>
                <p>${this.escapeHTML(message)}</p>
            </div>
        `;
    },

    async showPublicProfile(user) {
        const content = document.getElementById("page-content");

        if (!content) return;

        content.innerHTML = `
            <div style="
                width:100%;
                max-width:700px;
                margin:30px auto;
                padding:20px;
            ">
                <button
                    class="btn"
                    id="back-to-user-search"
                    style="margin-bottom:20px;"
                >
                    &lt; BACK TO SEARCH
                </button>

                <div class="profile-container" style="margin:0;">
                    <div class="profile-header">
                        <div class="profile-avatar" id="public-profile-avatar">
                            ${this.escapeHTML(
                                (user.display_name || user.username || "?")
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </div>

                        <div style="min-width:0;">
                            <div class="profile-display-name">
                                ${this.escapeHTML(user.display_name || user.username)}
                            </div>

                            <div class="profile-username">
                                @${this.escapeHTML(user.username)}
                            </div>

                            <div
                                id="public-profile-pronouns"
                                style="
                                    color:var(--text-muted);
                                    font-size:10px;
                                    margin-top:7px;
                                "
                            >
                                ${this.escapeHTML(user.pronouns || "")}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div class="form-label">ABOUT</div>
                        <div class="profile-bio">
                            ${this.escapeHTML(user.bio || "This user has not written a bio.")}
                        </div>
                    </div>

                    <div style="
                        border-top:1px solid var(--border);
                        margin-top:25px;
                        padding-top:20px;
                        display:flex;
                        flex-wrap:wrap;
                        gap:10px;
                    ">
                        <button
                            class="btn btn-primary"
                            id="start-direct-message"
                            type="button"
                        >
                            MESSAGE
                        </button>

                        <p style="
                            width:100%;
                            color:var(--text-dim);
                            font-size:9px;
                            margin-top:5px;
                        ">
                            PROJECT JUDAS USER DIRECTORY
                        </p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById("back-to-user-search").addEventListener(
            "click",
            () => this.showFindUsers()
        );

        document.getElementById("start-direct-message").addEventListener(
            "click",
            () => this.startDirectMessage(user.id)
        );

        if (user.avatar_url) {
            const { data, error } = await supabaseClient
                .storage
                .from("avatars")
                .createSignedUrl(user.avatar_url, 3600);

            if (!error && data) {
                const avatar = document.getElementById("public-profile-avatar");

                if (avatar) {
                    const image = document.createElement("img");
                    image.src = data.signedUrl;
                    image.alt = "Profile picture";

                    avatar.textContent = "";
                    avatar.appendChild(image);
                }
            }
        }
    },

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

window.JudasApp = JudasApp;

document.addEventListener("DOMContentLoaded", () => {
    JudasApp.init();
});
