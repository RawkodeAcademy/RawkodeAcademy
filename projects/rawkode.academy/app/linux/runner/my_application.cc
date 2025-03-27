#include "my_application.h"

#include <flutter_linux/flutter_linux.h>
#ifdef GDK_WINDOWING_X11
#include <gdk/gdkx.h>
#endif

#include "flutter/generated_plugin_registrant.h"

struct _MyApplication {
  GtkApplication parent_instance;
  char** dart_entrypoint_arguments;
};

G_DEFINE_TYPE(MyApplication, my_application, GTK_TYPE_APPLICATION)

// Implements GApplication::activate.
static void my_application_activate(GApplication* application) {
  MyApplication* self = MY_APPLICATION(application);
  GtkWindow* window =
      GTK_WINDOW(gtk_application_window_new(GTK_APPLICATION(application)));

  // Use a header bar when running in GNOME as this is the common style used
  // by applications and is the setup most users will be using (e.g. Ubuntu
  // desktop).
  // If running on X and not using GNOME then just use a traditional title bar
  // in case the window manager does more exotic layout, e.g. tiling.
  // If running on Wayland assume the header bar will work (may need changing
  // if future cases occur).
  gboolean use_header_bar = TRUE;
#ifdef GDK_WINDOWING_X11
  GdkScreen* screen = gtk_window_get_screen(window);
  if (GDK_IS_X11_SCREEN(screen)) {
    const gchar* wm_name = gdk_x11_screen_get_window_manager_name(screen);
    if (g_strcmp0(wm_name, "GNOME Shell") != 0) {
      use_header_bar = FALSE;
    }
  }
#endif
  if (use_header_bar) {
    GtkHeaderBar* header_bar = GTK_HEADER_BAR(gtk_header_bar_new());
    gtk_widget_show(GTK_WIDGET(header_bar));
    gtk_header_bar_set_title(header_bar, "rawkode_academy");
    gtk_header_bar_set_show_close_button(header_bar, TRUE);
    gtk_window_set_titlebar(window, GTK_WIDGET(header_bar));
  } else {
    gtk_window_set_title(window, "rawkode_academy");
  }

  gtk_window_set_default_size(window, 1280, 720);
  gtk_widget_show(GTK_WIDGET(window));

  g_autoptr(FlDartProject) project = fl_dart_project_new();
  fl_dart_project_set_dart_entrypoint_arguments(project, self->dart_entrypoint_arguments);

  FlView* view = fl_view_new(project);
  gtk_widget_show(GTK_WIDGET(view));
  gtk_container_add(GTK_CONTAINER(window), GTK_WIDGET(view));

  fl_register_plugins(FL_PLUGIN_REGISTRY(view));

  gtk_widget_grab_focus(GTK_WIDGET(view));
}

// Implements GApplication::local_command_line.
static gboolean my_application_local_command_line(GApplication* application, gchar*** arguments, int* exit_status) {
  MyApplication* self = MY_APPLICATION(application);

  // Check if we're being launched with a URL
  gchar** argv = *arguments;
  int argc = g_strv_length(argv);

  // Process URL arguments
  GPtrArray* dart_args = g_ptr_array_new();

  // Add the first argument (the executable name)
  g_ptr_array_add(dart_args, g_strdup(argv[0]));

  // Process remaining arguments
  for (int i = 1; i < argc; i++) {
    const char* arg = argv[i];

    // Check if this is a URL with our scheme
    if (g_str_has_prefix(arg, "app.rawkode.academy://")) {
      // Add the URL as a Dart argument
      g_ptr_array_add(dart_args, g_strdup("--url"));
      g_ptr_array_add(dart_args, g_strdup(arg));
    } else {
      // Pass through other arguments
      g_ptr_array_add(dart_args, g_strdup(arg));
    }
  }

  // Null-terminate the array
  g_ptr_array_add(dart_args, NULL);

  // Set the Dart entrypoint arguments
  self->dart_entrypoint_arguments = (char**)g_ptr_array_free(dart_args, FALSE);

  g_autoptr(GError) error = nullptr;
  if (!g_application_register(application, nullptr, &error)) {
     g_warning("Failed to register: %s", error->message);
     *exit_status = 1;
     return TRUE;
  }

  g_application_activate(application);
  *exit_status = 0;

  return TRUE;
}

// Implements GApplication::startup.
static void my_application_startup(GApplication* application) {
  //MyApplication* self = MY_APPLICATION(object);

  // Perform any actions required at application startup.

  G_APPLICATION_CLASS(my_application_parent_class)->startup(application);
}

// Implements GApplication::shutdown.
static void my_application_shutdown(GApplication* application) {
  //MyApplication* self = MY_APPLICATION(object);

  // Perform any actions required at application shutdown.

  G_APPLICATION_CLASS(my_application_parent_class)->shutdown(application);
}

// Implements GObject::dispose.
static void my_application_dispose(GObject* object) {
  MyApplication* self = MY_APPLICATION(object);
  g_clear_pointer(&self->dart_entrypoint_arguments, g_strfreev);
  G_OBJECT_CLASS(my_application_parent_class)->dispose(object);
}

// Implements GApplication::command_line.
static gint my_application_command_line(GApplication* application, GApplicationCommandLine* command_line) {
  MyApplication* self = MY_APPLICATION(application);
  gchar **argv;
  gint argc;

  argv = g_application_command_line_get_arguments(command_line, &argc);

  // Process URL arguments
  GPtrArray* dart_args = g_ptr_array_new();

  // Add the first argument (the executable name)
  g_ptr_array_add(dart_args, g_strdup(argv[0]));

  // Process remaining arguments
  for (int i = 1; i < argc; i++) {
    const char* arg = argv[i];

    // Check if this is a URL with our scheme
    if (g_str_has_prefix(arg, "app.rawkode.academy://")) {
      // Add the URL as a Dart argument
      g_ptr_array_add(dart_args, g_strdup("--url"));
      g_ptr_array_add(dart_args, g_strdup(arg));
    } else {
      // Pass through other arguments
      g_ptr_array_add(dart_args, g_strdup(arg));
    }
  }

  // Null-terminate the array
  g_ptr_array_add(dart_args, NULL);

  // Set the Dart entrypoint arguments
  g_clear_pointer(&self->dart_entrypoint_arguments, g_strfreev);
  self->dart_entrypoint_arguments = (char**)g_ptr_array_free(dart_args, FALSE);

  g_application_activate(application);

  g_strfreev(argv);
  return 0;
}

// Implements GApplication::open.
static void my_application_open(GApplication* application, GFile** files, gint n_files, const gchar* hint) {
  MyApplication* self = MY_APPLICATION(application);

  // Process files
  for (int i = 0; i < n_files; i++) {
    char* uri = g_file_get_uri(files[i]);
    if (g_str_has_prefix(uri, "app.rawkode.academy://")) {
      // Create a new array with the URL
      GPtrArray* dart_args = g_ptr_array_new();

      // Add the executable name as the first argument
      g_ptr_array_add(dart_args, g_strdup(g_get_prgname()));

      // Add the URL as a Dart argument
      g_ptr_array_add(dart_args, g_strdup("--url"));
      g_ptr_array_add(dart_args, g_strdup(uri));

      // Null-terminate the array
      g_ptr_array_add(dart_args, NULL);

      // Set the Dart entrypoint arguments
      g_clear_pointer(&self->dart_entrypoint_arguments, g_strfreev);
      self->dart_entrypoint_arguments = (char**)g_ptr_array_free(dart_args, FALSE);
    }
    g_free(uri);
  }

  // Activate the application
  g_application_activate(application);
}

static void my_application_class_init(MyApplicationClass* klass) {
  G_APPLICATION_CLASS(klass)->activate = my_application_activate;
  G_APPLICATION_CLASS(klass)->local_command_line = my_application_local_command_line;
  G_APPLICATION_CLASS(klass)->command_line = my_application_command_line;
  G_APPLICATION_CLASS(klass)->open = my_application_open;
  G_APPLICATION_CLASS(klass)->startup = my_application_startup;
  G_APPLICATION_CLASS(klass)->shutdown = my_application_shutdown;
  G_OBJECT_CLASS(klass)->dispose = my_application_dispose;
}

static void my_application_init(MyApplication* self) {}

MyApplication* my_application_new() {
  // Set the program name to the application ID, which helps various systems
  // like GTK and desktop environments map this running application to its
  // corresponding .desktop file. This ensures better integration by allowing
  // the application to be recognized beyond its binary name.
  g_set_prgname(APPLICATION_ID);

  return MY_APPLICATION(g_object_new(my_application_get_type(),
                                     "application-id", APPLICATION_ID,
                                     "flags", G_APPLICATION_HANDLES_COMMAND_LINE | G_APPLICATION_HANDLES_OPEN,
                                     nullptr));
}
