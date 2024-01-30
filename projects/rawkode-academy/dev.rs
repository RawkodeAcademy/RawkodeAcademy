use hmac::{Hmac, Mac};
use jwt::{AlgorithmType, Header, SignWithKey, Token};
use passwords::PasswordGenerator;
use sha2::Sha256;
use std::collections::BTreeMap;

#[tokio::main]
async fn main() -> eyre::Result<()> {
    let client = dagger_sdk::connect().await?;

    let pg = PasswordGenerator::new()
        .length(32)
        .numbers(true)
        .lowercase_letters(true)
        .uppercase_letters(true)
        .symbols(true)
        .spaces(true)
        .exclude_similar_characters(true)
        .strict(true);

    let postgres_password = pg.generate_one().unwrap();
    let jwt_secret = pg.generate_one().unwrap();

    let anon_token = get_token_with_role(&jwt_secret, "anon");
    let service_token = get_token_with_role(&jwt_secret, "service");

    client
        .container()
        .from("public.ecr.aws/supabase/postgres:aio-15.1.0.153")
        .with_env_variable("POSTGRES_PASSWORD", postgres_password)
        .with_env_variable("JWT_SECRET", jwt_secret)
        .with_env_variable("ANON_KEY", anon_token)
        .with_env_variable("SERVICE_ROLE_KEY", service_token)
        .with_env_variable("MACHINE_TYPE", "shared_cpu_1x_512m")
        .with_env_variable("DATA_VOLUME_MOUNTPOINT", "/data")
        .with_exposed_port(5432)
        .with_exposed_port(8000)
        .as_service();

    Ok(())
}

// type Supabase struct {
// 	Service    *Service
// 	AnonKey    string
// 	ServiceKey string
// }

// // Giving up, for now, trying to get this running like producation.
// // All in one image it is ...
// // Want the 'producation' code? Checkout commit
// //   - dcc6262a11d455c2b987a80434291f37b66e14c6
// func (m *Supabase) DevStack() (*Supabase, error) {
// 	postgresPassword, err := password.Generate(64, 10, 10, false, false)
// 	if err != nil {
// 		return nil, err
// 	}

// 	jwtSecret, err := password.Generate(64, 10, 10, false, false)
// 	if err != nil {
// 		return nil, err
// 	}

// 	now := time.Now()

// 	m.AnonKey, err = token.SignedString(jwtSecret)
// 	if err != nil {
// 		return nil, err
// 	}

// 	token = jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
// 		"role": "anon",
// 		"iss":  "supabase",
// 		"iat":  jwt.NewNumericDate(now),
// 		"exp":  jwt.NewNumericDate(now.Add(time.Duration(4) * time.Hour)),
// 	})

// 	m.ServiceKey, err = token.SignedString(jwtSecret)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return m, nil
// }

fn get_token_with_role(jwt_secret: &String, role: &'static str) -> &'static str {
    let key: Hmac<Sha256> = Hmac::new_from_slice(jwt_secret.as_bytes()).unwrap();
    let mut claims = BTreeMap::new();

    let now = chrono::Utc::now().timestamp();
    let later = now + 4 * 60 * 60;
    let now_string = now.to_string();
    let later_string = later.to_string();

    claims.insert("iss", "supabase");
    claims.insert("role", &role);
    claims.insert("iat", &now_string);
    claims.insert("exp", &later_string);

    let header = Header {
        algorithm: AlgorithmType::Rs256,
        ..Default::default()
    };

    Token::new(header, claims)
        .sign_with_key(&key)
        .unwrap()
        .as_str()
}
