use dagger_sdk::HostTunnelOpts;
use hmac::{Hmac, Mac};
use jwt::{AlgorithmType, Header, SignWithKey, Token};
use passwords::PasswordGenerator;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
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
    let client = dagger_sdk::connect().await?;

    let pg = PasswordGenerator::new()
        .length(32)
        .numbers(true)
        .lowercase_letters(true)
        .uppercase_letters(true)
        .symbols(false)
        .spaces(false)
        .strict(true);

    let postgres_password = String::from("hello");
    let jwt_secret = pg.generate_one().unwrap();
    let admin_token = get_token_with_role(&jwt_secret, "supabase_admin");
    let service_token = get_token_with_role(&jwt_secret, "service_role");
    let anon_token = get_token_with_role(&jwt_secret, "anon");

    let supabase = client
        .container()
        .from("public.ecr.aws/supabase/postgres:aio-15.1.0.147")
        .with_env_variable("POSTGRES_PASSWORD", &postgres_password)
        .with_env_variable("JWT_SECRET", &jwt_secret)
        .with_env_variable("ADMIN_API_KEY", &admin_token)
        .with_env_variable("ANON_KEY", &anon_token)
        .with_env_variable("SERVICE_ROLE_KEY", &service_token)
        .with_env_variable("MACHINE_TYPE", "shared_cpu_1x_512m")
        .with_env_variable("DATA_VOLUME_MOUNTPOINT", "/data")
        .with_exposed_port(5432)
        .with_exposed_port(8000)
        .as_service();

    let local_tunnel = client.host().tunnel_opts(
        supabase,
        HostTunnelOpts {
            native: Some(true),
            ports: None,
        },
    );

    local_tunnel.start().await?;

    match local_tunnel.endpoint().await {
        Ok(endpoint) => endpoint,
        Err(e) => {
            println!("Failed to get local tunnel endpoint: {}", e);
            std::process::exit(1);
        }
    };

    let mut signals = Signals::new([SIGHUP, SIGINT, SIGTERM])?;
    tokio::spawn(async move {
        for _ in signals.forever() {
            println!("Received SIGHUP, stopping tunnels");
            local_tunnel.stop().await.unwrap();
            println!("Finished");
        }
    });

    // We're running all these locally so they can get hot module reloading
    // while working on the app
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
            .arg("--db-url")
            .arg(format!(
                "postgres://postgres:{}@localhost:5432/postgres",
                &postgres_password
            ))
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
            .arg("--db-url")
            .arg(format!(
                "postgres://postgres:{}@localhost:5432/postgres",
                &postgres_password
            ))
            .arg("--schema")
            .arg("public")
            .arg("--schema")
            .arg("auth")
            .env("SUPABASE_URL", "http://localhost:8000")
            .env("SUPABASE_ANON_KEY", &anon_token)
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
            .env("SUPABASE_URL", "http://localhost:8000")
            .env("SUPABASE_ANON_KEY", &anon_token)
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

fn get_token_with_role(jwt_secret: &String, role: &'static str) -> String {
    let key: Hmac<Sha256> = Hmac::new_from_slice(jwt_secret.as_bytes()).unwrap();

    let now = chrono::Utc::now().timestamp();
    let later = now + 4 * 60 * 60;

    let claims = ClaimGrants {
        iss: "supabase".to_string(),
        role: role.to_string(),
        iat: now,
        exp: later,
    };

    let header = Header {
        algorithm: AlgorithmType::Hs256,
        ..Default::default()
    };

    Token::new(header, claims)
        .sign_with_key(&key)
        .unwrap()
        .into()
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
