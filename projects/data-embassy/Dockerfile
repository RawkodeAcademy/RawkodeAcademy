FROM ghcr.io/cueblox/blox:v0.7.4

ARG PROJECT_DIR
ARG DATA_DIR

COPY $DATA_DIR /data

# This ensures that the root, `../../` from our `blox.cue`
# still works in the container context
ARG CUEBLOX_ROOT=/cueblox/root
RUN mkdir -p ${CUEBLOX_ROOT}
WORKDIR ${CUEBLOX_ROOT}
COPY ${PROJECT_DIR}/blox.cue ${CUEBLOX_ROOT}/blox.cue
COPY ${PROJECT_DIR}/schemata ${CUEBLOX_ROOT}/schemata

ENTRYPOINT [ "/blox" ]
CMD [ "serve" ]
