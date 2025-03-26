import { DEFAULT_PAYLOAD } from "@/lib/payload";
import { createHash, type Template } from "@/lib/template";
import { html } from "satori-html";

export const template: Template = {
  font: {
    name: "Roboto",
    weight: 400,
    style: "normal",
  },

  hash() {
    // we call the render method with a stable input to calculate the hash
    return createHash(this.render(DEFAULT_PAYLOAD));
  },

  render(payload) {
    const defaultImage =
      `<svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 559.671 143.20864"><linearGradient id="primaryGradient" x1="0%" x2="100%" y1="0%" y2="0%"><stop offset="0%" stop-color="#5f5ed7" /><stop offset="100%" stop-color="#00ceff" /></linearGradient><path fill="url(#primaryGradient)" d="M50.01386,54.13608H.41927v14.40559H50.01386c.43999,0,.76999,.32999,.76999,.76999v9.4568H.41927v23.97255c0,8.35746,6.81796,15.17558,15.17558,15.17558h49.5946v-48.60493c0-8.35746-6.81812-15.17558-15.17558-15.17558Zm.76999,49.37492H15.59485c-.44015,0-.77015-.32983-.77015-.76999v-9.4568H50.78385v10.22679Zm429.3892-34.19934v48.60493h-14.29528v-48.60493c0-.43999-.32999-.76999-.8803-.76999h-23.97239c-.43951,0-.65983,.32999-.65983,.76999v48.60493h-14.51511v-48.60493c0-.43999-.32999-.76999-.65983-.76999h-24.08271c-.44015,0-.76999,.32999-.76999,.76999v48.60493h-14.40559V54.13608h79.06546c8.35762,0,15.17558,6.81812,15.17558,15.17558Zm-123.81568-15.17558h-34.41918c-8.35746,0-15.17542,6.81812-15.17542,15.17558v33.42935c0,8.35746,6.81796,15.17558,15.17542,15.17558h49.5946v-14.40559h-49.5946c-.43999,0-.76999-.32983-.76999-.76999v-9.4568h50.36458v-23.97255c0-8.35746-6.81796-15.17558-15.17542-15.17558Zm.76999,24.63238h-35.95915v-9.4568c0-.43999,.32999-.76999,.76999-.76999h34.41918c.43999,0,.76999,.32999,.76999,.76999v9.4568Zm202.54364-24.41191v73.67667c0,8.35746-6.70781,15.17542-15.06526,15.17542h-39.03798v-14.51559h39.03798c.32983,0,.65983-.21984,.65983-.65983v-10.11663h-35.18916c-8.35746,0-15.17494-6.81812-15.17494-15.17558V54.35655h14.40559v48.38446c0,.44015,.32936,.76999,.76935,.76999h34.52933c.32983,0,.65983-.32983,.65983-.76999V54.35655h14.40544Zm-355.82524-.22047h-49.5946v14.40559h49.5946c.43999,0,.76999,.32999,.76999,.76999v9.4568h-50.36458v23.97255c0,8.35746,6.81796,15.17558,15.17558,15.17558h49.5946v-48.60493c0-8.35746-6.81812-15.17558-15.17558-15.17558Zm.76999,49.37492h-35.189c-.44015,0-.77015-.32983-.77015-.76999v-9.4568h35.95915v10.22679Zm75.97961-49.37492h-35.29852c-8.35746,0-15.17558,6.81812-15.17558,15.17558v33.42935c0,8.35746,6.81812,15.17558,15.17558,15.17558h49.70412V33.24315h-14.40559v20.89293Zm0,48.60493c0,.44015-.32983,.76999-.76935,.76999h-34.52917c-.44015,0-.65983-.32983-.65983-.76999v-33.42935c0-.43999,.21968-.76999,.65983-.76999h34.52917c.43951,0,.76935,.32999,.76935,.76999v33.42935Zm-188.79995,.76999h49.5946v14.40559h-49.5946c-8.35746,0-15.17542-6.81812-15.17542-15.17558v-33.42935c0-8.35746,6.81796-15.17558,15.17542-15.17558h49.37492v14.40559h-49.37492c-.43999,0-.76999,.32999-.76999,.76999v33.42935c0,.44015,.32999,.76999,.76999,.76999ZM253.15692,35.57989v-6.37973h-21.96389c-.19465,0-.34083-.14619-.34083-.34083v-4.18837h22.30473V14.0544c0-3.70135-3.01921-6.72072-6.72056-6.72072h-15.24333c-3.70119,0-6.72056,3.01937-6.72056,6.72072v14.80494c0,3.70119,3.01937,6.72056,6.72056,6.72056h21.96389Zm-22.30473-21.5255c0-.19481,.14619-.34083,.34083-.34083h15.24333c.19465,0,.34083,.14603,.34083,.34083v4.18821h-15.925v-4.18821Zm-67.99774,21.5255h15.24333c3.70135,0,6.72056-3.01937,6.72056-6.72056V14.0544c0-3.70135-3.01921-6.72072-6.72056-6.72072h-15.24333c-3.70119,0-6.72056,3.01937-6.72056,6.72072v14.80494c0,3.70119,3.01937,6.72056,6.72056,6.72056Zm-.34083-21.5255c0-.19481,.14619-.34083,.34083-.34083h15.24333c.19465,0,.34083,.14603,.34083,.34083v14.80494c0,.19465-.14619,.34083-.34083,.34083h-15.24333c-.19465,0-.34083-.14619-.34083-.34083V14.0544Zm-17.23908-6.72072h6.86675v1.65571l-11.29871,12.46724,11.29871,12.4674v1.65587h-6.86675l-9.00134-10.189-6.0958,6.35023v3.83877h-6.37973V0h6.37973V23.4232l5.01607-5.18059,10.08108-10.90893Zm-84.71872,0h-21.96389v6.37988h21.96389c.19465,0,.34083,.14603,.34083,.34083v4.18821h-22.30473v10.61672c0,3.70119,3.01953,6.72056,6.72056,6.72056h21.96389V14.0544c0-3.70135-3.01937-6.72072-6.72056-6.72072Zm.34083,21.86649h-15.58417c-.19465,0-.34083-.14619-.34083-.34083v-4.18837h15.925v4.52921Zm135.93188,6.37973h22.01283V0h-6.37988V7.33368h-15.63295c-3.70103,0-6.72056,3.01937-6.72056,6.72072v14.80494c0,3.70119,3.01953,6.72056,6.72056,6.72056Zm-.29221-21.5255c0-.19481,.0974-.34083,.29221-.34083h15.29196c.19497,0,.34099,.14603,.34099,.34083v14.80494c0,.19465-.14603,.34083-.34099,.34083h-15.29196c-.19481,0-.29221-.14619-.29221-.34083V14.0544Zm-114.82995,21.5255l-11.10374-28.24621h6.76934l6.81812,16.65561c2.38616-5.50325,4.91882-11.20115,7.25636-16.65561h6.62316l7.69476,16.75286c2.14273-5.50309,4.33424-11.29839,6.37957-16.75286h6.7695l-10.61656,28.24621h-4.96761l-8.52261-18.89559-8.18146,18.89559h-4.91882ZM9.93776,19.62843C14.10159,14.4869,20.5234,6.49243,25.38834,.3944h9.33134c-4.83641,5.55235-9.80513,11.28133-14.62272,17.20034l-.37766,.46375,.38898,.4545c.57279,.66907,11.22904,12.96494,14.62224,16.87991h-8.4614c-1.08707-1.2535-2.3377-2.68044-3.60554-4.12716-2.47384-2.82328-5.03217-5.74237-6.54233-7.5626l-.54521-.65664-.55238,.65074c-1.69923,2.0018-3.42556,4.01046-5.08589,5.93463v-10.00344Zm-3.07931,13.62764L0,41.34857V4.5198C.00143,2.24396,1.84701,.39966,4.12285,.3995l17.3655-.00335c-.82403,1.04849-1.65874,2.09172-2.4732,3.10976-.98839,1.23548-2.00818,2.50987-3.00215,3.78489H6.85846v25.96527Z" /></svg>`;

    // Create a white version of the logo for dark background
    const whiteLogo = defaultImage.replace('fill="url(#primaryGradient)"', 'fill="white"');

    return html(
      `<div style="display: flex; flex-direction: column; width: 1200px; height: 630px; background: linear-gradient(135deg, #111827 0%, #1f2937 100%); color: white; font-family: Roboto;">
        <!-- Top accent line -->
        <div style="height: 6px; background: linear-gradient(90deg, #5f5ed7, #00ceff);"></div>

        <!-- Main content -->
        <div style="flex: 1; display: flex; padding: 60px;">
          <!-- Left content -->
          <div style="flex: ${payload.image ? '1' : '1'}; display: flex; flex-direction: column; justify-content: space-between;">
            <!-- Logo -->
            <div style="width: 140px; margin-bottom: 40px;">
              ${whiteLogo}
            </div>

            <!-- Text content -->
            <div style="display: flex; flex-direction: column; width: 100%;">
              <h1 style="font-size: ${payload.image ? '52px' : '64px'}; font-weight: 700; color: white; margin: 0 0 32px 0; line-height: 1.2; max-width: ${payload.image ? '500px' : '800px'};">
                ${payload.title}
              </h1>

              <div style="display: flex; padding: 8px 16px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; font-size: 16px; margin-bottom: 40px;">
                RAWKODE ACADEMY
              </div>
            </div>

            <!-- Footer -->
            <div style="display: flex; align-items: center;">
              <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(90deg, #5f5ed7, #00ceff); margin-right: 12px;"></div>
              <div style="font-size: 16px; color: rgba(255, 255, 255, 0.7);">
                rawkode.academy
              </div>
            </div>
          </div>

          <!-- Right content with image if provided -->
          ${payload.image ?
            `<div style="flex: 1; margin-left: 60px;">
              <div style="width: 100%; height: 100%; border-radius: 8px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                <img src="${payload.image}" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
            </div>`
            :
            `<div style="flex: 1; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 400px; height: 400px; border-radius: 50%; background: rgba(95, 94, 215, 0.1); filter: blur(60px);"></div>
              <div style="position: absolute; width: 300px; height: 300px; border-radius: 50%; background: rgba(0, 206, 255, 0.1); filter: blur(60px); transform: translate(100px, -50px);"></div>
            </div>`
          }
        </div>

        <!-- Bottom accent -->
        <div style="height: 1px; background: rgba(255, 255, 255, 0.1);"></div>
      </div>`
    );
  },
};
