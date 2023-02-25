<script lang="ts">
  export let title: string;
  export let date: string = "February 8th, 2022";
  export let author: string;
  export let role: string = "Blog Writer";
  export let img: string =
    "https://flowbite.com/docs/images/people/profile-picture-2.jpg";
</script>

<main class="pt-8 pb-16 lg:pt-16 lg:pb-24 lg:w-10/12 md:w-11/12 sm:w-full bg-white dark:bg-gray-900">
  <div class="flex justify-between px-4 mx-auto max-w-screen-xl ">
    <article
      class="mx-auto w-full max-w-2xl format format-sm sm:format-base lg:format-lg format-blue dark:format-invert"
    >
      <header class="mb-4 lg:mb-6 not-format">
        <address class="flex items-center mb-6 not-italic">
          <div
            class="inline-flex items-center mr-3 text-sm text-gray-900 dark:text-white"
          >
            <img class="mr-4 w-16 h-16 rounded-full" src={img} alt={author} />
            <div>
              <a
                href="#"
                rel="author"
                class="text-xl font-bold text-gray-900 dark:text-white"
                >{author}</a
              >
              <p class="text-base font-light text-gray-500 dark:text-gray-400">
                {role}
              </p>
              <p class="text-base font-light text-gray-500 dark:text-gray-400">
                <time datetime="2022-02-08" title={date}>{date}</time>
              </p>
            </div>
          </div>
        </address>
        <h1
          class="mb-4 text-3xl font-extrabold leading-tight text-gray-900 lg:mb-6 lg:text-4xl dark:text-white"
        >
          {title}
        </h1>
      </header>

      <h2>SUMMARY</h2>
      <br/>
      <p>
        This episode of Klustered has Guest Marino Wijay and John Anderson
        fighting the misconfigured kubecontext, misconfigured kubelet ,
        misconfigured kubescheduler , misconfigured etcd and misconfigured
        CNI(Cilium)
      </p>
      <br />
      <h2>LESSONS LEARNED</h2>
      <br/>
      <ul>
        <li>
          Always check for the kubectl context to make sure you are connected to
          the correct cluster
        </li>
        <li>
          Always check for the kubelet configuration including the extra args
        </li>
        <li>
          Always make sure that control plane components are configured with the
          correct certificates , even if the scheduler certificates are
          configured with the controller manager certificates, the scheduler
          will not be able to connect to the API server
        </li>
        <li>
          Always check for the certificate's validity and verify it has not
          tampered with miscellaneous data
        </li>
        <li>
          Always check for the version of the control plane components and make
          sure they are compatible with the each other
        </li>
      </ul>
      <br />
      <h2>USEFUL COMMANDS</h2>
      <br/>
      <li>
        We can check for the file which takes more space in the disk by using
        the `du -d1 -h` command
      </li>
      <li>
        We can find the systemd configuration file by using the `systemctl cat`
        command
      </li>
      <li>
        We can search for the file in which the string is present by using the
        `grep -r` command
      </li>

      <br />

      <h2>ALL THE BREAKS</h2>

      <br />

      <h3>Misconfigured Kubecontext</h3>

      <p>
        Fixer initially tried to fix the cluster in the wrong context This was
        fixed by switching the context to the correct cluster `kubectl config
        use-context production`
      </p>
      <br/>

      <h3>Low disk space</h3>

      <p>
        After switching to the right context , on looking at the nodes, the
        nodes were in the `NotReady` state , On describing the nodes , the fixer
        found that the node was in low disk space This was fixed by sshing into
        the node and deleting the files which were taking more space in the disk
      </p>
      <br/>

      <h3>Misconfigured Kubelet</h3>

      <p>
        After fixing the low disk space issue , the fixer found that the node
        was still in the `NotReady` state , On describing the node , they got
        `Invalid capacity 0 on image filesystem` error. On investigating
        further, the fixer found that the kubelet was configured with the wrong
        extra args This was fixed by removing the file that contains the extra
        args
      </p>
      <br/>

      <h3>Tampered certificates</h3>

      <p>
        The fixer tried to access the api server using the `kubectl` command ,
        but they notices the api server was not responding , On looking at the
        logs of the api server container, they found that one of the
        certificates has tampered with miscellaneous data This was fixed by
        removing the miscellaneous data from the certificate
      </p>
      <br/>

      <h3>Incompatible control plane components</h3>

      <p>
        The fixer tried to see the pods running in the cluster , but they got an
        error saying `kubelet network is not ready` . This was fixed by
        reinstalling the kubelet and the containerd with the correct version
      </p>

      <br />

      <h2>OTHER NOTES</h2>

      <ol>
        <li class="w-auto text-ellipsis">
          Bash script to install the necessary tools for debugging the cluster
          https://gist.githubusercontent.com/sontek/5b31111d56d30a48dca764fe72fd9b01/raw/e8c51a1e50a5d039b9270e7930c69913c5b87aac/klustered.sh
        </li>
      </ol>
    </article>
  </div>
</main>
