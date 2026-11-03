const JudasAuth = {

    // -------------------------------------
    // REGISTER A NEW ACCOUNT
    // -------------------------------------

    async register(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }

            return {
                success: true,
                user: data.user,
                session: data.session,
                message: data.session
                    ? "Account created successfully!"
                    : "Account created! Check your email for a confirmation link."
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },


    // -------------------------------------
    // LOG IN
    // -------------------------------------

    async login(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }

            return {
                success: true,
                user: data.user,
                session: data.session,
                message: "Login successful!"
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },


    // -------------------------------------
    // LOG OUT
    // -------------------------------------

    async logout() {
        try {
            const { error } = await supabaseClient.auth.signOut();

            if (error) {
                throw error;
            }

            return {
                success: true,
                message: "Logged out successfully."
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    },


    // -------------------------------------
    // GET CURRENT USER
    // -------------------------------------

    async getCurrentUser() {
        try {
            const { data, error } = await supabaseClient.auth.getUser();

            if (error) {
                throw error;
            }

            return data.user;

        } catch (error) {
            console.error("Could not retrieve current user:", error);
            return null;
        }
    },


    // -------------------------------------
    // GET CURRENT SESSION
    // -------------------------------------

    async getSession() {
        try {
            const { data, error } = await supabaseClient.auth.getSession();

            if (error) {
                throw error;
            }

            return data.session;

        } catch (error) {
            console.error("Could not retrieve session:", error);
            return null;
        }
    },


    // -------------------------------------
    // CHECK WHETHER USER IS SIGNED IN
    // -------------------------------------

    async isLoggedIn() {
        const session = await this.getSession();
        return session !== null;
    },


    // -------------------------------------
    // LISTEN FOR AUTHENTICATION CHANGES
    // -------------------------------------

    onAuthStateChange(callback) {
        return supabaseClient.auth.onAuthStateChange(
            (event, session) => {
                callback(event, session);
            }
        );
    }

};


// Make authentication functions available
// to the rest of the website.

window.JudasAuth = JudasAuth;
