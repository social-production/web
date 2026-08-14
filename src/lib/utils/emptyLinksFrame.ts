import type { DetailLinkSubjectKind, DetailLinksFrameData } from '$lib/types/detail';

export function emptyLinksFrame(
  ownerKind: DetailLinkSubjectKind,
  ownerSlug: string
): DetailLinksFrameData {
  return {
    ownerKind,
    ownerSlug,
    intro: '',
    activeLinks: [],
    pendingLinkRequests: [],
    historicalLinks: [],
    historicalLinkRequests: [],
    linkableRecords: [],
    viewerCanProposeLinks: false,
    conversionNote: '',
    conversionWorkflow: [],
    conversionLineage: null,
    autoLinks: [],
    manualLinks: [],
    manualLinkRequests: [],
    linkableProjects: [],
    requestFrames: [],
    placeholderSections: []
  };
}
