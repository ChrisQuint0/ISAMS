use std::process::Command;
use tauri::Manager;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[tauri::command]
fn save_csv_template(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_file_binary(path: String, content: Vec<u8>) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

fn start_backend_servers(app_handle: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    use std::io::Write;
    
    let base_resource_dir = app_handle.path().resource_dir()?;
    
    // Tauri bundles resources in a _up_ subdirectory in production
    let resource_dir = if base_resource_dir.join("_up_").exists() {
        base_resource_dir.join("_up_")
    } else {
        base_resource_dir.clone()
    };
    
    // Create a log file for debugging
    let log_path = base_resource_dir.join("backend_startup.log");
    let mut log_file = std::fs::File::create(&log_path).ok();
    
    let mut log = |msg: &str| {
        eprintln!("{}", msg);  // Print to stderr
        if let Some(ref mut f) = log_file {
            let _ = writeln!(f, "{}", msg);
        }
    };
    
    log(&format!("🚀 Starting backend servers from: {:?}", resource_dir));
    log(&format!("📝 Log file: {:?}", log_path));
    
    // List of backend servers to start
    let servers = vec![
        ("server.js", "Main Backend"),
        ("thesis_backend.js", "Thesis Backend"),
        ("submission_backend.js", "Submission Backend"),
        ("hte_backend.js", "HTE Backend"),
    ];

    for (script, name) in servers {
        let script_path = resource_dir.join(script);
        
        log(&format!("Starting {}: {:?}", name, script_path));
        
        if !script_path.exists() {
            let err_msg = format!("❌ Script not found: {:?}", script_path);
            log(&err_msg);
            return Err(err_msg.into());
        }
        
        #[cfg(target_os = "windows")]
        {
            match Command::new("node")
                .arg(&script_path)
                .current_dir(&resource_dir)
                .creation_flags(0x08000000) // CREATE_NO_WINDOW
                .spawn()
            {
                Ok(child) => {
                    log(&format!("✅ {} started (PID: {})", name, child.id()));
                }
                Err(e) => {
                    let err_msg = format!("❌ Failed to start {}: {}", name, e);
                    log(&err_msg);
                    return Err(err_msg.into());
                }
            }
        }
        
        #[cfg(not(target_os = "windows"))]
        {
            match Command::new("node")
                .arg(&script_path)
                .current_dir(&resource_dir)
                .spawn()
            {
                Ok(child) => {
                    log(&format!("✅ {} started (PID: {})", name, child.id()));
                }
                Err(e) => {
                    let err_msg = format!("❌ Failed to start {}: {}", name, e);
                    log(&err_msg);
                    return Err(err_msg.into());
                }
            }
        }
    }
    
    log("✅ All backend servers started successfully");
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![save_csv_template, save_file_binary])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      // Start backend servers in production
      #[cfg(not(debug_assertions))]
      {
          println!("🚀 Starting backend servers...");
          if let Err(e) = start_backend_servers(&app.handle()) {
              eprintln!("❌ Failed to start backend servers: {}", e);
          } else {
              println!("✅ All backend servers started");
          }
      }
      
      Ok(())
    })
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}