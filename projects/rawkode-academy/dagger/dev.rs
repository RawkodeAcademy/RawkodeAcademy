// If we decide to get this running with Dagger again
// revert to commit  d591d456166e2f6f41c5ec8609a30f554cfbaf36
// for the code.
//
use serde::{Deserialize, Serialize};
use signal_hook::{
    consts::{SIGHUP, SIGINT, SIGTERM},
    iterator::Signals,
};
use std::{
    fs::File,
    process::{Command, ExitStatus, Stdio},
};

#[tokio::main]
async fn main() -> eyre::Result<()> {
    check_status(Command::new("supabase").arg("start").status());

    let mut signals = Signals::new([SIGHUP, SIGINT, SIGTERM])?;
    tokio::spawn(async move {
        for _ in signals.forever() {
            println!("Received SIGHUP: If you're done, run supabase stop --no-backup");
        }
    });

    check_status(
        Command::new("bun")
            .arg("install")
            .current_dir("./web")
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .status(),
    );

    check_status(
        Command::new("supabase")
            .arg("db")
            .arg("push")
            .arg("--local")
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .status(),
    );

    let types_file = File::create("./web/src/database.types.ts").expect("failed to open log");

    check_status(
        Command::new("supabase")
            .arg("gen")
            .arg("types")
            .arg("typescript")
            .arg("--local")
            .arg("--schema")
            .arg("public")
            .arg("--schema")
            .arg("auth")
            .current_dir("./web")
            .stdout(types_file)
            .stderr(Stdio::inherit())
            .status(),
    );

    check_status(
        Command::new("bun")
            .arg("run")
            .arg("dev")
            .current_dir("./web")
            .env("SUPABASE_URL", "http://localhost:54321")
            .env("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE")
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .status(),
    );

    Ok(())
}

#[derive(Default, Deserialize, Serialize)]
struct ClaimGrants {
    pub iss: String,
    pub role: String,
    pub iat: i64,
    pub exp: i64,
}

fn check_status(result: std::io::Result<ExitStatus>) {
    match result {
        Ok(status) => {
            if !status.success() {
                println!("Failed to execute process: {}", status);
                std::process::exit(1);
            }
        }
        Err(e) => {
            println!("Failed to execute process: {}", e);
            std::process::exit(1);
        }
    }
}
